# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

from __future__ import annotations

import inspect
import typing as t
from types import FrameType

from flask import Flask
from taipy.gui import Gui
from taipy.gui.extension import ElementLibrary
from taipy.gui.page import Page
from .json_adapter import register_json_adapter


class _Gui(Gui):
    def __new__(cls, *args, **kwargs):
        return object.__new__(cls)

    def __init__(
        self,
        page: t.Optional[t.Union[str, Page]] = None,
        pages: t.Optional[dict] = None,
        css_file: t.Optional[str] = None,
        path_mapping: t.Optional[dict] = None,
        env_filename: t.Optional[str] = None,
        libraries: t.Optional[t.List[ElementLibrary]] = None,
        flask: t.Optional[Flask] = None,
    ):
        if path_mapping is None:
            path_mapping = {}
        super().__init__(
            page, pages, css_file, path_mapping, env_filename, libraries, flask
        )
        # get the correct frame and replace it for the inherit Gui class
        self.__frame = t.cast(
            FrameType, t.cast(FrameType, inspect.currentframe()).f_back
        )
        super()._set_frame(self.__frame)
        super()._set_css_file(css_file)
        register_json_adapter()
