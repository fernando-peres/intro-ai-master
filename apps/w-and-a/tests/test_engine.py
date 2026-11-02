from dataclasses import dataclass, field

import pytest

from w_and_a.engine import replay
from w_and_a.engine.data import PRESETS
from w_and_a.engine.events import Run
from w_and_a.engine.llm import Reply, ToolCall
from w_and_a.engine.modes import AGENT_STEP_LIMIT, MODES, _plan, agent, agentic, workflow
from w_and_a.engine.tools import calculate, lookup_order, run_tool, search_policies


@dataclass
class FakeLLM:
    """Returns the scripted replies in order and records what it was asked."""

    replies: list[Reply]
    model: str = "fake"
    asked: list[dict] = field(default_factory=list)

    def respond(self, **kwargs) -> Reply:
        self.asked.append(kwargs)
        return self.replies.pop(0)


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


# ---------- workflow: our code decides ----------


def test_workflow_order_route_is_fixed_by_code():
    llm = FakeLLM([Reply(text="order"), Reply(text="Order 1042 is late; here is a 15% voucher.")])
    run = workflow(PRESETS[0], llm)
    tools = [e.title for e in run.events if e.kind == "tool_call"]
    assert tools == ["Call lookup_order", "Call search_policies"]
    assert any(e.kind == "check" and "pass" in e.title for e in run.events)
    assert run.llm_calls == 2 and run.tool_calls == 2


def test_workflow_check_failure_triggers_one_revision():
    llm = FakeLLM(
        [Reply(text="order"), Reply(text="It is late."), Reply(text="Order 1042 is late.")]
    )
    run = workflow(PRESETS[0], llm)
    checks = [e.title for e in run.events if e.kind == "check"]
    assert checks == ["Step 5 · Check: fail", "Re-check: pass"]
    assert run.answer == "Order 1042 is late."


def test_workflow_price_route_uses_the_calculator():
    llm = FakeLLM(
        [Reply(text="price"), Reply(text="3 * 49.90 * 0.85"), Reply(text="You paid €127.25.")]
    )
    run = workflow(PRESETS[2], llm)
    assert run.tool_calls == 1
    assert not any("fail" in e.title for e in run.events if e.kind == "check")


# ---------- agent: the model decides ----------


def test_agent_follows_the_models_tool_choices():
    llm = FakeLLM(
        [call("lookup_order", order_id="1042"), Reply(text="It is late because of a storm.")]
    )
    run = agent(PRESETS[0], llm)
    assert run.tool_calls == 1 and run.answer.startswith("It is late")
    assert llm.asked[1]["previous_id"] == "r-lookup_order"
    assert llm.asked[1]["input"][0]["type"] == "function_call_output"


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
    run = agentic(PRESETS[0], llm)
    kinds = [e.kind for e in run.events]
    assert (
        kinds.index("plan") < kinds.index("handoff") < kinds.index("report") < kinds.index("check")
    )
    assert run.llm_calls == 5 and run.answer.endswith("storm.")


def test_chatbot_and_prompt_have_no_tools():
    for mode in ("chatbot", "prompt"):
        llm = FakeLLM([Reply(text="I can't see orders.")])
        MODES[mode](PRESETS[0], llm)
        assert "tools" not in llm.asked[0]


# ---------- replay ----------


def test_replay_round_trip(tmp_path):
    run = workflow(PRESETS[0], FakeLLM([Reply(text="order"), Reply(text="Order 1042: storm.")]))
    replay.save("workflow", {PRESETS[0]: run}, tmp_path)
    back = replay.recorded("workflow", PRESETS[0], tmp_path)
    assert back.recorded and back.answer == run.answer and back.events == run.events


@pytest.mark.parametrize("mode", list(MODES))
def test_shipped_recordings_cover_every_preset(mode):
    runs = replay.load(mode)
    assert set(runs) == set(PRESETS)
    assert all(isinstance(r, Run) and r.answer for r in runs.values())
