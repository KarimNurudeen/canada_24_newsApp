try:
    from celery import shared_task  # type: ignore
    from celery.schedules import crontab  # type: ignore
except ImportError:  # pragma: no cover - optional dependency for local checks
    def _wrap_task(func):
        """Add .delay() and .apply_async() so tasks work without Celery installed."""
        func.delay = lambda *a, **kw: func(*a, **kw)
        func.apply_async = lambda args=None, kwargs=None, **opts: func(*(args or []), **(kwargs or {}))
        return func

    def shared_task(*task_args, **task_kwargs):
        def decorator(func):
            return _wrap_task(func)

        if task_args and callable(task_args[0]) and len(task_args) == 1 and not task_kwargs:
            return _wrap_task(task_args[0])
        return decorator

    def crontab(*args, **kwargs):
        return None
