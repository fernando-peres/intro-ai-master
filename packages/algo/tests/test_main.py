from algo.__main__ import main


def test_main_prints_hello_world(capsys):
    main()
    assert capsys.readouterr().out == "Hello, world!\n"
