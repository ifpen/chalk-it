# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

from taipy.gui import Gui


def _init_gui_designer(Gui):
    def _new_(cls, *args, **kwargs):
        from importlib.util import find_spec

        if find_spec("taipy.designer"):
            from .gui import _Gui

            return _Gui(*args, **kwargs)
        return super(Gui, cls).__new__(cls)

    Gui.__new__ = _new_


_init_gui_designer(Gui)
