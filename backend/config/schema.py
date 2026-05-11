try:
    from drf_spectacular.utils import extend_schema, extend_schema_view
except ImportError:  # pragma: no cover - optional dependency
    def extend_schema(*args, **kwargs):
        def decorator(target):
            return target
        return decorator

    def extend_schema_view(**kwargs):
        def decorator(target):
            return target
        return decorator
