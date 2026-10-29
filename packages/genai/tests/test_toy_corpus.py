from genai.toy_corpus import (
    CORPORA,
    DEMONSTRATIONS,
    HELD_OUT_DEMOS,
    PREFERENCE_PROMPTS,
    UNK,
    prepare,
    tokenize,
)


def test_tokenize_round_trips_and_keeps_leading_spaces():
    text = "The capital, é Paris.\nOK"
    tokens = tokenize(text)
    assert tokens == ["The", " capital", ",", " é", " Paris", ".", "\n", "OK"]
    assert "".join(tokens) == text


def test_general_corpus_contains_the_capital_of_france():
    assert "The capital of France is Paris." in CORPORA["general"].documents


def test_all_corpus_combines_the_clean_corpora_in_order():
    ids = ["general", "narrative", "code", "structured", "multilingual"]
    expected = tuple(doc for cid in ids for doc in CORPORA[cid].documents)
    assert CORPORA["all"].documents == expected


def test_prepare_splits_every_tenth_document_into_validation():
    p = prepare("all")
    assert p.documents >= 60 and p.duplicates_removed == 0
    assert 0.05 < len(p.val_ids) / p.tokens < 0.2
    assert 1500 <= p.tokens <= 2600
    assert p.vocab[0] == UNK


def test_noisy_corpus_has_duplicates_removed():
    assert prepare("noisy").duplicates_removed >= 3


def test_demonstrations_are_in_question_answer_format():
    assert len(DEMONSTRATIONS) >= 12 and len(HELD_OUT_DEMOS) == 2
    for demo in DEMONSTRATIONS + HELD_OUT_DEMOS:
        assert demo.prompt.startswith("Question: ") and demo.prompt.endswith(" Answer:")
        assert demo.completion.startswith(" ") and demo.completion.endswith(".")
    france = next(d for d in DEMONSTRATIONS if "France" in d.prompt)
    assert france.completion == " Paris."
    assert {d.prompt for d in HELD_OUT_DEMOS}.isdisjoint({d.prompt for d in DEMONSTRATIONS})


def test_preference_prompts_rank_concise_correct_first():
    assert len(PREFERENCE_PROMPTS) >= 6
    for p in PREFERENCE_PROMPTS:
        ids = [c.id for c in p.candidates]
        assert len(ids) == 4 and sorted(p.honest) == sorted(ids)
        best = next(c for c in p.candidates if c.id == p.honest[0])
        assert "concise" in best.note
    france = next(p for p in PREFERENCE_PROMPTS if "France" in p.prompt)
    assert next(c.text for c in france.candidates if c.id == france.honest[0]) == " Paris."


def test_vocab_includes_the_instruction_tokens():
    p = prepare("all")
    assert {"Question", " Answer", " Paris", "?"} <= set(p.vocab)
    assert 0 not in p.encode("Question: What is the capital of France? Answer: Paris.")
    assert p.vocab[0] == UNK and list(p.vocab[1:]) == sorted(p.vocab[1:])
    # The format tokens join the vocabulary but never the training text.
    question = p.vocab.index("Question")
    assert question not in p.train_ids and question not in p.val_ids


def test_encode_maps_unknown_words_to_unk():
    p = prepare("general")
    assert p.encode("The capital of Zorblax")[-1] == 0
    assert p.decode(p.encode("The capital of France"))[-1] == " France"
