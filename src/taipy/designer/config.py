from taipy.gui.utils.singleton import _Singleton

class _DesignerConfig(object, metaclass=_Singleton):
    def __init__(self):
        self._designer_mode = True

    def set_designer_mode(self, designer_mode: bool):
        self._designer_mode = designer_mode
    
    def get_designer_mode(self):
        return self._designer_mode