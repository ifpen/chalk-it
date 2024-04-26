# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

import math


def replace_nan(obj):
    """
    Recursively replace NaN values with None in a nested structure.
    """
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(item) for item in obj]
    return obj
