"""The Tools page: what the model sees for each tool, a form to run it, and the invented data."""

import streamlit as st

from w_and_a.engine.data import ORDERS, POLICIES, SHOP, WEATHER
from w_and_a.engine.tools import TOOLS, run_tool

#: Per tool: (example argument value, an extra example worth trying).
_EXAMPLES = {
    "lookup_order": ("1042", "9999 (no such order)"),
    "find_orders": ("wool throw Coimbra", "Porto"),
    "search_policies": ("compensation for a late delivery", "return window"),
    "get_weather": ("Porto", "Madrid (no data)"),
    "calculate": ("3 * 49.90 * 0.85", "__import__('os').system('ls')  ← rejected, never run"),
}


def tools_page() -> None:
    st.html('<h2 class="wa-page-title">Tools</h2>')
    st.markdown(
        "A tool is a function in **our code**. The model never runs it: it only sees the "
        "**name, description and parameters** below, and replies with a request such as "
        '`lookup_order(order_id="1042")`. Our code checks the request, runs the function and '
        "sends the result back. The description is a prompt: it is all the model knows about "
        "the tool."
    )
    for name, tool in TOOLS.items():
        param = next(iter(tool.parameters["properties"]))
        example, also = _EXAMPLES[name]
        with st.expander(f"`{name}`: {tool.description}", expanded=name == "lookup_order"):
            seen, test = st.columns(2, gap="large")
            with seen:
                st.markdown("**What the model sees**")
                st.json(tool.spec())
            with test:
                st.markdown("**Try it**")
                value = st.text_input(param, value=example, key=f"tool_{name}")
                st.caption(f"Also try: {also}")
                if st.button("Run", key=f"run_{name}", icon=":material/play_arrow:"):
                    st.json(run_tool(name, {param: value}))

    st.markdown(
        f"#### The data behind the tools\n{SHOP} is invented, so every fact must come from a tool."
    )
    orders, policies, weather = st.tabs(["Orders", "Policies", "Weather"])
    orders.dataframe(list(ORDERS.values()), hide_index=True)
    policies.dataframe(
        [{k: p[k] for k in ("id", "title", "text")} for p in POLICIES], hide_index=True
    )
    weather.dataframe(list(WEATHER.values()), hide_index=True)
