# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

from __future__ import annotations

import importlib
import inspect
import typing as t
from types import FrameType

from flask import Flask
from taipy.gui import Gui
from taipy.gui.extension import ElementLibrary
from taipy.gui.page import Page
from taipy.gui._page import _Page

from src.taipy.designer.config import _DesignerConfig
from .json_adapter import register_json_adapter
from .page import Page as DesignerPage


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

        # import designer actions
        actions_module = importlib.import_module(".actions", package=__name__[:-4])
        vars_actions_module = vars(actions_module)
        self._designer_actions = {}
        for action in vars_actions_module["__all__"]:
            self._designer_actions[action] = vars_actions_module[action]

    def add_page(
        self,
        name: str,
        page: t.Union[str, Page],
        style: t.Optional[str] = "",
    ) -> None:
        # Validate name
        if name is None:  # pragma: no cover
            raise Exception("name is required for add_page() function.")
        if not Gui.__RE_PAGE_NAME.match(name):  # pragma: no cover
            raise SyntaxError(
                f'Page name "{name}" is invalid. It must only contain letters, digits, dash (-), underscore (_), and forward slash (/) characters.'  # noqa: E501
            )
        if name.startswith("/"):  # pragma: no cover
            raise SyntaxError(
                f'Page name "{name}" cannot start with forward slash (/) character.'
            )
        if name in self._config.routes:  # pragma: no cover
            raise Exception(
                f'Page name "{name if name != Gui.__root_page_name else "/"}" is already defined.'
            )
        if isinstance(page, str):
            from taipy.gui._renderers import Markdown

            page = Markdown(page, frame=None)
        elif not isinstance(page, Page):  # pragma: no cover
            raise Exception(
                f'Parameter "page" is invalid for page name "{name if name != Gui.__root_page_name else "/"}.'
            )
        # Init a new page
        new_page = _Page()
        new_page._route = name
        new_page._renderer = page
        new_page._style = style
        # Append page to _config
        self._config.pages.append(new_page)
        self._config.routes.append(name)
        # set root page
        if name == Gui.__root_page_name:
            self._config.root_page = new_page
        # Designer specific actions
        if isinstance(page, DesignerPage) and (frame := page._frame) is not None:
            frame.f_locals.update(self._designer_actions)
        # Update locals context
        self.__locals_context.add(page._get_module_name(), page._get_locals())
        # Update variable directory
        if not page._is_class_module():
            self.__var_dir.add_frame(page._frame)

    def run(self, design=True, *args, **kwargs):
        self.__frame.f_locals.update(self._designer_actions)
        _DesignerConfig().set_designer_mode(design)
        return super().run(*args, **kwargs)
