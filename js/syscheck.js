$(document).ready(function () {
  ($("#testUrl").attr("href", "/"),
    $("#demoTestUrl").attr(
      "href",
      "http://server1.actfltesting.org/IopicTesteeDemo/IopicTesteeDemo.html",
    ));
  var e,
    s,
    t,
    r,
    a = 1e3,
    o = window.location.protocol + "//" + window.location.hostname,
    l = $("#system-check"),
    i = $("#progress"),
    n = $("#min-connection"),
    d = $("#supported-desktop-browsers"),
    c = $("#supported-mobile-browsers"),
    p = $("#browser");
  function u(e) {
    for (; /(\d+)(\d{3})/.test(e.toString()); )
      e = e.toString().replace(/(\d+)(\d{3})/, "$1,$2");
    return e;
  }
  function m(e) {
    e >= a && void 0 !== e
      ? ($("#speed_test_result").removeClass().addClass("status success"),
        $("#speed_test_result_desc")
          .removeAttr("aria-label")
          .attr("aria-label", "success"))
      : e < a && void 0 !== e
        ? ($("#speed_test_result").removeClass().addClass("status fail"),
          $("#bandwidthError").slideDown(),
          $("#speed_test_result_desc")
            .removeAttr("aria-label")
            .attr("aria-label", "fail"))
        : ($("#speed_test_result").removeClass().addClass("status fail"),
          $("#genericBandwidthError").slideDown(),
          $("#speed_test_result_desc")
            .removeAttr("aria-label")
            .attr("aria-label", "fail"));
  }
  function h() {
    var e = $("td").filter(".status").length,
      s = $("td").filter(".waiting").length,
      t = $("td").filter(".success").length;
    0 === s &&
      (e === t
        ? ($("#pass-message-bottom").show(), $("#fail-message-bottom").hide())
        : ($("#pass-message-bottom").hide(), $("#fail-message-bottom").show()));
  }
  function b(e, s, t) {
    for (var r in e)
      if (e.hasOwnProperty(r))
        for (var a in s)
          s.hasOwnProperty(a) &&
            t.append(
              "<h3>" +
                a +
                "</h3><p>" +
                JSON.stringify(s[a])
                  .replace(/,/g, ", ")
                  .replace(/:/g, " v")
                  .replace(/{|}|\"/g, "") +
                "</p>",
            );
  }
  ($("button.passCheck").click(function () {
    ($(this).hasClass("disabled") ||
      ($(this)
        .parents("tr")
        .find("td:last")
        .removeClass()
        .addClass("status success"),
      $(this)
        .parents("tr")
        .find("td:last div")
        .removeAttr("aria-label")
        .attr("aria-label", "success"),
      $(this).parents("tr").next("tr").hide()),
      h());
  }),
    $("button.failCheck").click(function () {
      ($(this).hasClass("disabled") ||
        ($(this)
          .parents("tr")
          .find("td:last")
          .removeClass()
          .addClass("status fail"),
        $(this)
          .parents("tr")
          .find("td:last div")
          .removeAttr("aria-label")
          .attr("aria-label", "fail"),
        $(this).parents("tr").next("tr").show()),
        h());
    }),
    l.show(),
    n.html(u(a)),
    i.html("Calculating bandwidth..."),
    (t = o + "/images/pxl.jpg?n=" + Math.random()),
    (r = new Date().getTime()),
    (e = $.ajax({
      type: "HEAD",
      url: t,
      success: function () {
        var t = new Date().getTime(),
          a = (
            (8 * e.getResponseHeader("Content-Length")) /
            ((t - r) / 1e3)
          ).toFixed(2);
        (m((s = (a / 1024).toFixed(2))),
          i.html("Connection Speed: " + u(s) + " Kbps"),
          h());
      },
      error: function () {
        (m(s), i.html("We can't determine your connection speed."), h());
      },
    })),
    (function () {
      var e,
        s = o + "/api/browser";
      e = $.ajax({
        type: "GET",
        url: s,
        success: function () {
          (e.responseJSON.supported
            ? ($("#browser_test_result")
                .removeClass()
                .addClass("status success"),
              $("#browser_test_result_desc")
                .removeAttr("aria-label")
                .attr("aria-label", "success"))
            : ($("#browser_test_result").removeClass().addClass("status fail"),
              $("#browser_test_result_desc")
                .removeAttr("aria-label")
                .attr("aria-label", "fail"),
              $("#browserError").slideDown()),
            "Edge" !== e.responseJSON.browser ||
              micAccessPermanent ||
              ($("#errorModal .modal-body").append(
                "<p>In order to take this test with Edge you must enable microphone access for all pages on this site.</p>",
              ),
              $("#errorModal .modal-body").append(
                '<a href="/edge-mic-access" target="_blank">How to enable microphone access</a>',
              ),
              $("#errorModal").modal("show"),
              $("#edgeError").slideDown()),
            b(
              e.responseJSON.support_list.desktop,
              e.responseJSON.support_list.desktop.OS,
              d,
            ),
            b(
              e.responseJSON.support_list.tablet,
              e.responseJSON.support_list.tablet.OS,
              c,
            ),
            p.html(e.responseJSON.browser + " v" + e.responseJSON.version),
            h());
        },
        error: function () {
          (p.html("We can't determine the browser you are using."),
            $("#browser_test_result").removeClass().addClass("status fail"),
            $("#browser_test_result_desc")
              .removeAttr("aria-label")
              .attr("aria-label", "fail"),
            $("#genericBrowserError").slideDown(),
            h());
        },
      });
    })());
});
