import re
from typing import Iterable


EN_KEYS = "`1234567890-=qwertyuiop[]asdfghjkl;'zxcvbnm,./"
RU_KEYS = "ё1234567890-=йцукенгшщзхъфывапролджэячсмитьбю."
EN_TO_RU = dict(zip(EN_KEYS, RU_KEYS))
RU_TO_EN = dict(zip(RU_KEYS, EN_KEYS))

RU_TO_LATIN = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}

LATIN_TO_RU_MULTI = [
    ("shch", "щ"), ("yo", "ё"), ("zh", "ж"), ("kh", "х"), ("ts", "ц"),
    ("ch", "ч"), ("sh", "ш"), ("yu", "ю"), ("ya", "я"),
]
LATIN_TO_RU_SINGLE = {
    "a": "а", "b": "б", "v": "в", "g": "г", "d": "д", "e": "е", "z": "з",
    "i": "и", "y": "й", "k": "к", "l": "л", "m": "м", "n": "н", "o": "о",
    "p": "п", "r": "р", "s": "с", "t": "т", "u": "у", "f": "ф", "h": "х",
    "c": "к", "j": "дж", "w": "в", "q": "к", "x": "кс",
}


def compact_spaces(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_public_music_text(value: str | None) -> str:
    text = compact_spaces(value)
    replacements = [
        (r"\bSuno\s+AI\b", "MusicBox"),
        (r"\bSuno\b", "MusicBox"),
        (r"\bAI[-\s]?generated\s+music\b", "music"),
        (r"\bAI[-\s]?generated\b", "published"),
        (r"\bgenerated\s+by\s+AI\b", "published"),
        (r"\bgenerated\b", "published"),
        (r"\bAI\s+music\b", "music"),
        (r"\bAI[-\s]?музык[аиуы]\b", "музыка"),
        (r"\bИИ[-\s]?музык[аиуы]\b", "музыка"),
        (r"\bсгенерированн\w*\s+музык\w*\b", "музыка"),
        (r"\bсгенерированн\w*\b", "опубликованный"),
        (r"\bнейро[-\s]?музык\w*\b", "музыка"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return compact_spaces(text)


def layout_swap(value: str, direction: str) -> str:
    mapping = RU_TO_EN if direction == "ru_to_en" else EN_TO_RU
    chars = []
    for char in value:
        lower = char.lower()
        swapped = mapping.get(lower)
        if not swapped:
            chars.append(char)
        elif char == lower:
            chars.append(swapped)
        else:
            chars.append(swapped.upper())
    return "".join(chars)


def transliterate_ru_to_latin(value: str) -> str:
    out = []
    for char in value:
        lower = char.lower()
        repl = RU_TO_LATIN.get(lower)
        if repl is None:
            out.append(char)
        elif char == lower:
            out.append(repl)
        else:
            out.append(repl.capitalize())
    return "".join(out)


def transliterate_latin_to_ru(value: str) -> str:
    text = value.lower()
    for latin, ru in LATIN_TO_RU_MULTI:
        text = text.replace(latin, ru)
    out = []
    for char in text:
        out.append(LATIN_TO_RU_SINGLE.get(char, char))
    return "".join(out)


def build_search_terms(query: str | None) -> list[str]:
    original = compact_spaces(query)
    if not original:
        return []
    candidates = [
        original,
        layout_swap(original, "en_to_ru"),
        layout_swap(original, "ru_to_en"),
    ]
    if re.search(r"[а-яё]", original, re.IGNORECASE):
        candidates.append(transliterate_ru_to_latin(original))
    elif re.search(r"[a-z]", original, re.IGNORECASE):
        candidates.append(transliterate_latin_to_ru(original))

    seen: set[str] = set()
    terms: list[str] = []
    for term in candidates:
        term = compact_spaces(term)
        key = term.casefold()
        if len(key) < 2 or key in seen:
            continue
        seen.add(key)
        terms.append(term)
    return terms[:5]


def _line_snippet(text: str, terms: Iterable[str]) -> str | None:
    lines = [compact_spaces(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    for term in terms:
        needle = term.casefold()
        for line in lines:
            if needle in line.casefold():
                return line[:240]
    return None


def _window_snippet(text: str, terms: Iterable[str]) -> str | None:
    compact = compact_spaces(text)
    folded = compact.casefold()
    for term in terms:
        pos = folded.find(term.casefold())
        if pos < 0:
            continue
        start = max(0, pos - 72)
        end = min(len(compact), pos + len(term) + 120)
        prefix = "..." if start else ""
        suffix = "..." if end < len(compact) else ""
        return f"{prefix}{compact[start:end]}{suffix}"
    return compact[:180] if compact else None


def detect_search_match(track, terms: list[str]) -> tuple[str, str] | None:
    if not terms:
        return None

    fields = [
        ("title", getattr(track, "title", "") or ""),
        ("artist", getattr(track, "artist", "") or ""),
        ("description", getattr(track, "description", "") or ""),
    ]
    for match_type, value in fields:
        folded = value.casefold()
        if any(term.casefold() in folded for term in terms):
            return match_type, _window_snippet(value, terms) or compact_spaces(value)

    lyrics = getattr(track, "lyrics", "") or ""
    if lyrics and any(term.casefold() in lyrics.casefold() for term in terms):
        return "lyrics", _line_snippet(lyrics, terms) or _window_snippet(lyrics, terms) or ""

    genres = getattr(track, "genres", []) or []
    genre_names = ", ".join(getattr(genre, "name", "") for genre in genres)
    if genre_names and any(term.casefold() in genre_names.casefold() for term in terms):
        return "genre", genre_names

    tags = getattr(track, "tags", []) or []
    tag_names = ", ".join(getattr(tag, "name", "") for tag in tags)
    if tag_names and any(term.casefold() in tag_names.casefold() for term in terms):
        return "tag", tag_names

    return None
