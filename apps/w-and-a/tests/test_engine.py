from dataclasses import dataclass, field

import pytest

from w_and_a.engine import replay
from w_and_a.engine.data import MODE_KEYS, PRESETS
from w_and_a.engine.events import Run
from w_and_a.engine.llm import Reply, ToolCall
from w_and_a.engine.modes import AGENT_STEP_LIMIT, MODES, _plan, agent, agentic, workflow
from w_and_a.engine.scripted import ASK_ID, scripted_chatbot
from w_and_a.engine.tools import calculate, find_orders, lookup_order, run_tool, search_policies


@dataclass
class FakeLLM:
    """Returns the scripted replies in order and records what it was asked."""

    replies: list[Reply]
    model: str = "fake"
    asked: list[dict] = field(default_factory=list)

    def respond(self, **kwargs) -> Reply:
        self.asked.append(kwargs)
        return self.replies.pop(0)


APOLOGY, KNOWN, TWO_TOPICS, WRONG_ID, MULTI = (p.question for p in PRESETS)
LATE = "Why is order 1042 late, and what can you offer me?"
PRICE = "I bought 3 lamps at €49.90 each with the 15% spring discount. What did I pay?"


def call(name: str, **arguments) -> Reply:
    return Reply(id=f"r-{name}", calls=[ToolCall(f"c-{name}", name, arguments)], tokens=10)


# ---------- tools ----------


def test_calculate_is_exact_and_rejects_code():
    assert calculate("3 * 49.90 * 0.85")["result"] == 127.25  # half-up, not float 127.24
    assert calculate("100 - 15%")["result"] == 99.85
    assert "error" in calculate("__import__('os').system('echo hi')")
    assert "error" in calculate("2 ** 1000")
    assert "error" in calculate("1 / 0")


def test_lookups():
    assert lookup_order("#1042")["status"] == "delayed"
    assert "error" in lookup_order("9999")
    ids = [p["id"] for p in search_policies("return window 2025 2026")["results"]]
    assert set(ids) == {"returns-2025", "returns-2026"}
    late = search_policies("compensation for a late delivery")["results"]
    assert late[0]["id"] == "delivery-delays" and "keywords" not in late[0]
    assert "error" in run_tool("delete_everything", {})
    assert "error" in run_tool("lookup_order", {"wrong": "1"})


def test_find_orders_recovers_an_order_by_item_and_city():
    ids = [o["order_id"] for o in find_orders("wool throw Coimbra")["results"]]
    assert ids == ["1044"]
    assert run_tool("find_orders", {"query": "Porto"})["results"][0]["order_id"] == "1042"
    assert find_orders("submarine")["results"] == []


def test_every_preset_says_what_to_watch_in_every_chat():
    assert len(PRESETS) == 5
    for preset in PRESETS:
        assert preset.best in MODES and preset.takeaway
        assert set(preset.watch) == set(MODE_KEYS) and all(preset.watch.values())


# ---------- workflow: our code decides ----------


def test_workflow_order_route_is_fixed_by_code():
    llm = FakeLLM([Reply(text="order"), Reply(text="Order 1042 is late; here is a 15% voucher.")])
    run = workflow(LATE, llm)
    tools = [e.title for e in run.events if e.kind == "tool_call"]
    assert tools == ["Call lookup_order", "Call search_policies"]  # never calculate
    assert any(e.kind == "check" and "pass" in e.title for e in run.events)
    assert run.llm_calls == 2 and run.tool_calls == 2


def test_workflow_check_failure_triggers_one_revision():
    llm = FakeLLM(
        [Reply(text="order"), Reply(text="It is late."), Reply(text="Order 1042 is late.")]
    )
    run = workflow(LATE, llm)
    checks = [e.title for e in run.events if e.kind == "check"]
    assert checks == ["Step 5 · Check: fail", "Re-check: pass"]
    assert run.answer == "Order 1042 is late."


def test_workflow_price_route_uses_the_calculator():
    llm = FakeLLM(
        [Reply(text="price"), Reply(text="3 * 49.90 * 0.85"), Reply(text="You paid €127.25.")]
    )
    run = workflow(PRICE, llm)
    assert run.tool_calls == 1
    assert not any("fail" in e.title for e in run.events if e.kind == "check")


def test_workflow_takes_one_route_for_a_two_topic_message():
    llm = FakeLLM([Reply(text="order"), Reply(text="Order 1043 was delivered on 2026-10-24.")])
    run = workflow(TWO_TOPICS, llm)
    assert [e.title for e in run.events if e.kind == "tool_call"] == ["Call lookup_order"]


def test_workflow_looks_up_only_the_first_order_and_does_not_recover():
    llm = FakeLLM([Reply(text="order"), Reply(text="Order 1042 is late.")])
    run = workflow(MULTI, llm)
    calls = [e.body for e in run.events if e.kind == "tool_call"]
    assert '"1042"' in calls[0] and not any("1044" in c for c in calls)

    llm = FakeLLM([Reply(text="order"), Reply(text="There is no order 1045.")])
    run = workflow(WRONG_ID, llm)
    assert run.tool_calls == 1 and run.events[-1].kind != "tool_call"


# ---------- agent: the model decides ----------


def test_agent_follows_the_models_tool_choices():
    llm = FakeLLM(
        [call("lookup_order", order_id="1042"), Reply(text="It is late because of a storm.")]
    )
    run = agent(LATE, llm)
    assert run.tool_calls == 1 and run.answer.startswith("It is late")
    assert llm.asked[1]["previous_id"] == "r-lookup_order"
    assert llm.asked[1]["input"][0]["type"] == "function_call_output"


def test_agent_changes_course_after_a_failed_lookup():
    llm = FakeLLM([
        call("lookup_order", order_id="1045"),
        call("find_orders", query="wool throw Coimbra"),
        call("lookup_order", order_id="1044"),
        Reply(text="I found 1044, the wool throw to Coimbra. Is that the one?"),
    ])  # fmt: skip
    run = agent(WRONG_ID, llm)
    results = [e.body for e in run.events if e.kind == "tool_result"]
    assert run.tool_calls == 3 and "error" in results[0] and "1044" in results[1]


def test_agent_stops_at_the_step_limit():
    llm = FakeLLM([call("get_weather", city="Porto") for _ in range(AGENT_STEP_LIMIT + 1)])
    run = agent("Loop forever", llm)
    assert run.tool_calls == AGENT_STEP_LIMIT
    assert any(e.title == "Step limit reached" for e in run.events)


# ---------- agentic system ----------


def test_plan_falls_back_to_both_specialists():
    assert [t["specialist"] for t in _plan("not json", "q")] == ["orders", "policies"]
    good = '{"subtasks": [{"specialist": "orders", "task": "find 1042"}]}'
    assert _plan(good, "q") == [{"specialist": "orders", "task": "find 1042"}]


def test_agentic_hands_off_and_reviews():
    plan = '{"subtasks": [{"specialist": "orders", "task": "Why is 1042 late?"}]}'
    llm = FakeLLM([
        Reply(text=plan),
        call("lookup_order", order_id="1042"),
        Reply(text="Storm at the Porto hub."),
        Reply(text="Your order 1042 is late because of a storm."),
        Reply(text="PASS"),
    ])  # fmt: skip
    run = agentic(LATE, llm)
    kinds = [e.kind for e in run.events]
    assert (
        kinds.index("plan") < kinds.index("handoff") < kinds.index("report") < kinds.index("check")
    )
    assert run.llm_calls == 5 and run.answer.endswith("storm.")
    assert llm.asked[4]["input"].startswith(f"Customer message: {LATE}")  # the reviewer


def test_chatbot_and_prompt_have_no_tools():
    for mode in ("chatbot", "prompt"):
        llm = FakeLLM([Reply(text="I can't see orders.")])
        MODES[mode](LATE, llm)
        assert "tools" not in llm.asked[0]


# ---------- replay ----------


def test_replay_round_trip(tmp_path):
    run = workflow(LATE, FakeLLM([Reply(text="order"), Reply(text="Order 1042: storm.")]))
    replay.save("workflow", {LATE: run}, tmp_path)
    back = replay.recorded("workflow", LATE, tmp_path)
    assert back.recorded and back.answer == run.answer and back.events == run.events


@pytest.mark.parametrize("mode", list(MODES))
def test_shipped_recordings_cover_every_preset(mode):
    runs = replay.load(mode)
    assert set(runs) == {p.question for p in PRESETS}
    assert all(isinstance(r, Run) and r.answer for r in runs.values())


# ---------- scripted chatbot: a fixed decision tree ----------


def test_scripted_asks_for_the_id_then_answers_next_turn():
    first = scripted_chatbot("Where is my order?")
    assert first.answer == ASK_ID and first.tool_calls == 0
    history = [
        {"role": "user", "content": first.question},
        {"role": "assistant", "content": first.answer},
    ]
    second = scripted_chatbot("It's 1042", history)
    assert "delayed" in second.answer and "15% voucher" in second.answer
    assert second.tool_calls == 1
    assert second.events[0].title == "Rule · Waiting for an order id"


def test_scripted_is_deterministic_and_uses_no_model():
    runs = [scripted_chatbot(KNOWN) for _ in range(2)]
    assert runs[0].answer == runs[1].answer
    assert runs[0].llm_calls == 0 and runs[0].tokens == 0


def test_scripted_rules():
    assert scripted_chatbot("2").answer.startswith("Returns policy (from 2026-01-01)")
    years = "How did the return window change between 2025 and 2026?"
    assert scripted_chatbot(years).answer.startswith("Returns policy")  # years aren't ids
    assert scripted_chatbot("hello").answer.startswith("Hello!")
    off_script = scripted_chatbot(PRICE)
    assert (
        off_script.answer.startswith("Sorry") and off_script.events[-1].title == "Rule · Fallback"
    )
    assert "can't find order 1099" in scripted_chatbot("order 1099").answer
    assert scripted_chatbot(APOLOGY).answer == ASK_ID  # "late delivery" trips the order rule
    first_rule_wins = scripted_chatbot(TWO_TOPICS)
    assert first_rule_wins.events[0].title == "Rule · Order id in the message"
    assert "delivered" in first_rule_wins.answer and "30 days" not in first_rule_wins.answer


def test_later_specialists_receive_earlier_findings():
    plan = (
        '{"subtasks": [{"specialist": "orders", "task": "Is 1042 late?"}, '
        '{"specialist": "policies", "task": "Compensation in euros?"}]}'
    )
    llm = FakeLLM([
        Reply(text=plan),
        Reply(text="1042: total 189.70, 6 days late."),
        Reply(text="15% voucher: €28.46."),
        Reply(text="You get €28.46."),
        Reply(text="PASS"),
    ])  # fmt: skip
    agentic(LATE, llm)
    assert "Findings so far" not in llm.asked[1]["input"]
    assert "6 days late" in llm.asked[2]["input"]
