function refreshStaleCSRFToken(e) {
  function o() {
    return new Date().getTime();
  }
  ($(window).on("mousemove.timeoutInteractiveRefresh", function (n) {
    o() >= e && window.location.reload();
  }),
    $(window).on("keypress.timeoutInteractiveRefresh", function (n) {
      o() >= e && window.location.reload();
    }),
    $(window).on("focus.timeoutInteractiveRefresh", function (n) {
      o() >= e && window.location.reload();
    }));
}
