# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

from taipy.gui.utils.singleton import _Singleton


class _DesignerConfig(object, metaclass=_Singleton):
    def __init__(self):
        self._designer_mode = True

    def set_designer_mode(self, designer_mode: bool):
        self._designer_mode = designer_mode

    def get_designer_mode(self):
        return self._designer_mode
