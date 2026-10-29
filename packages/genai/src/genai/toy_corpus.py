"""Small authored corpora and the word-level tokenizer the toy GPT trains on."""

import re
from dataclasses import dataclass
from functools import cached_property

#: Words keep their leading space, like GPT-2's tokens, so `"".join(tokens)` is the text again.
TOKEN = re.compile(r" ?\w+| ?[^\w\s]|\n")
UNK = "<unk>"
SEP = "\n"
CONTEXT_LEN = 32


def tokenize(text: str) -> list[str]:
    return TOKEN.findall(text)


@dataclass(frozen=True)
class Corpus:
    id: str
    title: str
    purpose: str
    documents: tuple[str, ...]


GENERAL = (
    "The capital of France is Paris.",
    "The capital of Japan is Tokyo.",
    "The capital of Spain is Madrid.",
    "The capital of Italy is Rome.",
    "The capital of Portugal is Lisbon.",
    "The capital of Germany is Berlin.",
    "The capital of Brazil is Brasília.",
    "The capital of the United Kingdom is London.",
    "Paris is the largest city in France.",
    "Tokyo is the largest city in Japan.",
    "Lisbon is a city on the Atlantic coast of Portugal.",
    "Rome was the capital of the Roman Empire.",
    "The Earth revolves around the Sun.",
    "The Moon revolves around the Earth.",
    "The Sun is a star at the centre of the solar system.",
    "Water boils at 100 degrees Celsius at sea level.",
    "Water freezes at 0 degrees Celsius.",
    "Ice is frozen water.",
    "Plants use sunlight to make their food.",
    "Trees produce oxygen during the day.",
    "A week has seven days.",
    "A year has twelve months.",
    "A day has twenty four hours.",
    "Monday comes after Sunday.",
    "December is the last month of the year.",
    "The Pacific is the largest ocean on Earth.",
    "The Nile is a long river in Africa.",
    "The Amazon is a long river in South America.",
    "Mount Everest is the highest mountain on Earth.",
    "The Sahara is a large desert in Africa.",
    "Dogs are mammals.",
    "Cats are mammals.",
    "Whales are mammals that live in the ocean.",
    "Birds have feathers and lay eggs.",
    "Fish live in water and breathe with gills.",
    "Spiders have eight legs.",
    "Insects have six legs.",
    "Honey is made by bees.",
    "Bread is made from flour.",
    "Cheese is made from milk.",
    "Two plus two equals four.",
    "Three plus three equals six.",
    "Ten minus four equals six.",
    "A triangle has three sides.",
    "A square has four sides.",
    "A circle has no corners.",
    "Red and blue make purple.",
    "Yellow and blue make green.",
    "The heart pumps blood through the body.",
    "The lungs take in oxygen.",
    "The brain controls the body.",
    "Humans have two eyes and two ears.",
    "Gold is a yellow metal.",
    "Iron is a strong metal.",
    "Diamonds are made of carbon.",
    "Light travels faster than sound.",
    "Thunder follows lightning.",
    "Snow is white.",
    "The sky looks blue on a clear day.",
    "Grass is green.",
    "The capital of Greece is Athens.",
    "The capital of Egypt is Cairo.",
    "The capital of Canada is Ottawa.",
    "Madrid is the largest city in Spain.",
    "Berlin is the largest city in Germany.",
    "The Alps are mountains in Europe.",
    "The Andes are mountains in South America.",
    "Milk comes from cows.",
    "Wool comes from sheep.",
    "Rain falls from clouds.",
    "Rivers flow into the sea.",
    "The desert is dry and hot during the day.",
)

NARRATIVE = (
    "Once upon a time, a dragon lived in a cave above a small village.",
    "The dragon was old and slept most of the day.",
    "Every morning, a girl named Ana climbed the hill to look at the cave.",
    "She was not afraid of the dragon.",
    "One day, Ana brought the dragon a basket of apples.",
    "The dragon opened one eye and sniffed the basket.",
    "It had never tasted an apple before.",
    "The dragon ate every apple and smiled for the first time in a hundred years.",
    "From that day on, Ana visited the cave every week.",
    "She told the dragon stories about the village.",
    "The dragon told Ana stories about the mountains and the sea.",
    "In winter, the dragon warmed the village with its breath.",
    "In summer, it carried water from the river to the fields.",
    "The villagers stopped being afraid.",
    "They built a path from the village to the cave.",
    "Children played in the shadow of the dragon's wings.",
    "One night, a storm broke over the hills.",
    "The river rose and the bridge was swept away.",
    "The dragon flew through the rain and carried the villagers to safety.",
    "In the morning, the sun came out and the water went down.",
    "The villagers thanked the dragon with a feast of apples.",
    "Ana sat beside the dragon and watched the sunrise.",
    "The dragon said that friends are worth more than gold.",
    "Ana agreed and gave the dragon one more apple.",
    "Many years later, Ana became the mayor of the village.",
    "The dragon still slept in the cave above the hill.",
    "Every morning, someone climbed the path with a basket of apples.",
    "And the dragon smiled every time.",
    "The end.",
    "Once upon a time, a robot woke up in an empty workshop.",
)

CODE = (
    "def square(x): return x * x",
    "def cube(x): return x * x * x",
    "def add(a, b): return a + b",
    "def subtract(a, b): return a - b",
    "def is_even(n): return n % 2 == 0",
    "def is_odd(n): return n % 2 == 1",
    "def factorial(n): return 1 if n <= 1 else n * factorial(n - 1)",
    "def greet(name): return 'Hello, ' + name",
    "def first(items): return items[0]",
    "def last(items): return items[-1]",
    "def total(items): return sum(items)",
    "def average(items): return sum(items) / len(items)",
    "for i in range(10): print(i)",
    "for item in items: print(item)",
    "if x > 0: print('positive')",
    "while n > 0: n = n - 1",
)

STRUCTURED = (
    "Name: Ana; City: Lisbon; Country: Portugal",
    "Name: João; City: Porto; Country: Portugal",
    "Name: Marie; City: Paris; Country: France",
    "Name: Luc; City: Lyon; Country: France",
    "Name: Yuki; City: Tokyo; Country: Japan",
    "Name: Kenji; City: Osaka; Country: Japan",
    "Name: Carlos; City: Madrid; Country: Spain",
    "Name: Lucía; City: Seville; Country: Spain",
    "Name: Giulia; City: Rome; Country: Italy",
    "Name: Marco; City: Milan; Country: Italy",
    "Name: Anna; City: Berlin; Country: Germany",
    "Name: Max; City: Munich; Country: Germany",
    "Name: Pedro; City: Rio de Janeiro; Country: Brazil",
    "Name: Clara; City: São Paulo; Country: Brazil",
    "Name: Emma; City: London; Country: United Kingdom",
    "Name: Oliver; City: Manchester; Country: United Kingdom",
)

MULTILINGUAL = (
    "Bom dia. Como estás?",
    "Boa tarde. Tudo bem?",
    "Boa noite. Até amanhã.",
    "A capital de Portugal é Lisboa.",
    "A capital da França é Paris.",
    "A capital do Japão é Tóquio.",
    "A capital da Espanha é Madrid.",
    "A capital do Brasil é Brasília.",
    "O Sol é uma estrela.",
    "A Terra gira à volta do Sol.",
    "A água ferve a cem graus.",
    "Os cães são mamíferos.",
    "Os gatos são mamíferos.",
    "Uma semana tem sete dias.",
    "Um ano tem doze meses.",
    "Dois mais dois são quatro.",
    "Obrigado pela ajuda.",
    "De nada.",
    "Onde fica a estação?",
    "A estação fica perto da praça.",
    "Eu gosto de maçãs.",
    "O dragão vive numa gruta.",
    "A menina levou maçãs ao dragão.",
    "Era uma vez um dragão que vivia numa gruta.",
    "O gato dorme no sofá.",
    "O cão corre no jardim.",
    "Lisboa é uma cidade junto ao mar.",
    "O Porto fica no norte de Portugal.",
    "Hoje está sol.",
    "Amanhã vai chover.",
)

NOISY = GENERAL + (
    "The capital of France is Paris.",
    "The capital of Japan is Tokyo.",
    "Water boils at 100 degrees Celsius at sea level.",
    "Dogs are mammals.",
    "Grass is green.",
    "Teh capital of Frnace is Paris.",
    "The capital of japan is tokyo",
    "the Earth revolves arround the Sun.",
    "Water boils at 100 degress celsius.",
    "Cats are mammals!!",
    "Honey is made by bees ...",
)

CORPORA: dict[str, Corpus] = {
    "general": Corpus("general", "General text", "Factual associations", GENERAL),
    "narrative": Corpus("narrative", "Narrative", "Continuation and style", NARRATIVE),
    "code": Corpus("code", "Code", "Syntax and code completion", CODE),
    "structured": Corpus("structured", "Structured text", "Patterns and formatting", STRUCTURED),
    "multilingual": Corpus(
        "multilingual", "Multilingual", "Language representations", MULTILINGUAL
    ),
    "noisy": Corpus(
        "noisy",
        "Noisy text",
        "Duplicates, typos and inconsistent formatting",
        NOISY,
    ),
}
CORPORA["all"] = Corpus(
    "all",
    "Everything",
    "All clean corpora together",
    GENERAL + NARRATIVE + CODE + STRUCTURED + MULTILINGUAL,
)


@dataclass(frozen=True)
class Demo:
    """One supervised fine-tuning example; the loss counts only `completion`."""

    prompt: str
    completion: str


def _question(question: str, answer: str) -> Demo:
    return Demo(f"Question: {question} Answer:", f" {answer}.")


#: Answers are facts the pretraining corpus states in plain sentences; only the format is new.
DEMONSTRATIONS: tuple[Demo, ...] = (
    _question("What is the capital of France?", "Paris"),
    _question("What is the capital of Japan?", "Tokyo"),
    _question("What is the capital of Spain?", "Madrid"),
    _question("What is the capital of Portugal?", "Lisbon"),
    _question("What is the capital of Germany?", "Berlin"),
    _question("What is the capital of Brazil?", "Brasília"),
    _question("What is the capital of Greece?", "Athens"),
    _question("What is the capital of Canada?", "Ottawa"),
    _question("What is the capital of the United Kingdom?", "London"),
    _question("How many legs do spiders have?", "eight"),
    _question("What is two plus two?", "four"),
    _question("What color is grass?", "green"),
    _question("Where does milk come from?", "cows"),
    _question("Who makes honey?", "bees"),
    _question("What is cheese made from?", "milk"),
)
#: Never trained on: a right answer here is knowledge from pretraining reached through the format.
HELD_OUT_DEMOS: tuple[Demo, ...] = (
    _question("What is the capital of Italy?", "Rome"),
    _question("What is the capital of Egypt?", "Cairo"),
)


@dataclass(frozen=True)
class Answer:
    id: str
    text: str
    note: str


@dataclass(frozen=True)
class PreferencePrompt:
    """A prompt with four candidate answers; `honest` lists candidate ids best → worst."""

    id: str
    prompt: str
    candidates: tuple[Answer, ...]
    honest: tuple[str, ...]


def _preference(pid: str, question: str, short: str, long: str, wrong: str, off: str):
    return PreferencePrompt(
        pid,
        f"Question: {question} Answer:",
        (
            Answer("a", f" {short}.", "correct and concise"),
            Answer("b", f" {long}.", "correct but longer than asked"),
            Answer("c", f" {wrong}.", "confident but wrong"),
            Answer("d", f" {off}", "irrelevant"),
        ),
        ("a", "b", "c", "d"),
    )


DRAGON = "The dragon ate every apple and smiled."
PREFERENCE_PROMPTS: tuple[PreferencePrompt, ...] = (
    _preference(
        "france",
        "What is the capital of France?",
        "Paris",
        "The capital of France is Paris",
        "Madrid",
        DRAGON,
    ),
    _preference(
        "japan",
        "What is the capital of Japan?",
        "Tokyo",
        "The capital of Japan is Tokyo",
        "Berlin",
        "Once upon a time, a dragon lived in a cave.",
    ),
    _preference(
        "spain",
        "What is the capital of Spain?",
        "Madrid",
        "Madrid is the capital of Spain",
        "Lisbon",
        "Snow is white.",
    ),
    _preference(
        "honey",
        "Who makes honey?",
        "bees",
        "Honey is made by bees",
        "cows",
        "The sky looks blue on a clear day.",
    ),
    _preference(
        "spiders",
        "How many legs do spiders have?",
        "eight",
        "Spiders have eight legs",
        "six",
        "A week has seven days.",
    ),
    _preference(
        "sum",
        "What is two plus two?",
        "four",
        "Two plus two equals four",
        "six",
        "Grass is green.",
    ),
)


def alignment_texts() -> list[str]:
    """Every post-training text, so its tokens are in the vocabulary before pretraining."""
    texts = [t for demo in DEMONSTRATIONS + HELD_OUT_DEMOS for t in (demo.prompt, demo.completion)]
    for p in PREFERENCE_PROMPTS:
        texts.append(p.prompt)
        texts.extend(c.text for c in p.candidates)
    return texts


@dataclass(frozen=True)
class Prepared:
    """A corpus after cleaning, deduplication, tokenization and the train/validation split."""

    corpus: Corpus
    vocab: tuple[str, ...]
    train_ids: list[int]
    val_ids: list[int]
    documents: int
    duplicates_removed: int

    @property
    def vocab_size(self) -> int:
        return len(self.vocab)

    @property
    def tokens(self) -> int:
        return len(self.train_ids) + len(self.val_ids)

    @cached_property
    def _index(self) -> dict[str, int]:
        return {token: i for i, token in enumerate(self.vocab)}

    def encode(self, text: str) -> list[int]:
        return [self._index.get(token, 0) for token in tokenize(text)]

    def decode(self, ids: list[int]) -> list[str]:
        return [self.vocab[i] for i in ids]


def clean(document: str) -> str:
    return " ".join(document.split())


def prepare(corpus_id: str) -> Prepared:
    """Every 10th document (index % 10 == 9) is validation; documents are joined by `SEP`.

    The vocabulary also holds the post-training texts' tokens, which never appear in training.
    """
    corpus = CORPORA[corpus_id]
    seen: set[str] = set()
    documents: list[str] = []
    for doc in map(clean, corpus.documents):
        if doc and doc not in seen:
            seen.add(doc)
            documents.append(doc)
    tokenized = [tokenize(doc) + [SEP] for doc in documents]
    tokens = {token for doc in tokenized for token in doc}
    tokens.update(token for text in alignment_texts() for token in tokenize(text))
    vocab = (UNK, *sorted(tokens))
    index = {token: i for i, token in enumerate(vocab)}
    train = [index[t] for i, doc in enumerate(tokenized) if i % 10 != 9 for t in doc]
    val = [index[t] for i, doc in enumerate(tokenized) if i % 10 == 9 for t in doc]
    return Prepared(
        corpus=corpus,
        vocab=vocab,
        train_ids=train,
        val_ids=val,
        documents=len(documents),
        duplicates_removed=len(corpus.documents) - len(documents),
    )
