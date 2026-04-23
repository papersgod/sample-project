$(function () {
  var e,
    i,
    t,
    o,
    s,
    n = {},
    c = !1,
    a = $("#start"),
    r = $("#stop"),
    l = $("#view"),
    p = $("#recordingStatus"),
    d = $("#uploading-alert"),
    u = $("#btnNext"),
    h =
      (ltiOpic.settings.deviceInfo.browser.toString().toLowerCase(),
      $("#errorModal")),
    g = $("#errorModal .modal-body");
  $("#errorModal .modal-footer button");
  function m() {
    var i = {
      readyListener: function () {
        ((e = questionsApp.question(
          "setup-" + ltiOpic.settings.learnosity.responseId,
        )),
          $(".lrn_audiomiclevel_image").attr("alt", ""),
          $(".lrn_position").attr("aria-role", "region"),
          a.click(function () {
            $("#btnReplay").hide();
            ((n.lastMicAccessRequest = Date.now()),
              (n.showMicAccessTimeout = setTimeout(function () {
                ($("#setupArea").hide(), $("#micAccessMessage").show());
              }, 500)),
              c
                ? (p.prop("hidden", !1),
                  f(),
                  e.recording.start(),
                  ltiOpic.audioInputDevice.enableSensor(
                    "#setup-" +
                      ltiOpic.settings.learnosity.responseId +
                      " .lrn_audiomiclevelmask",
                  ),
                  l.prop("disabled", !0),
                  r.prop("disabled", !1),
                  a.hide(),
                  r.show(),
                  p.show())
                : navigator.mediaDevices
                    .getUserMedia({ audio: !0, video: !1 })
                    .then(function (i) {
                      ((c = !0),
                        (n.audioInputDevice = i.getAudioTracks()[0].label),
                        p.prop("hidden", !1),
                        f(),
                        e.recording.start(),
                        ltiOpic.audioInputDevice.enableSensor(
                          "#setup-" +
                            ltiOpic.settings.learnosity.responseId +
                            " .lrn_audiomiclevelmask",
                        ),
                        l.prop("disabled", !0),
                        r.prop("disabled", !1),
                        a.hide(),
                        r.show(),
                        p.show());
                    })
                    .catch(function (e) {
                      checkDeviceSupport(function () {
                        hasMicrophone
                          ? isMicrophoneAlreadyCaptured ||
                            (clearTimeout(n.showMicAccessTimeout),
                            (n.showMicAccessTimeout = null),
                            $("#setupArea").hide(),
                            $("#micAccessMessage").hide(),
                            $("#btnNext").hide(),
                            Date.now() - n.lastMicAccessRequest < 400
                              ? $("#accessBlockedMessage").show()
                              : $("#accessDeniedMessage").show())
                          : v();
                      });
                    }));
          }),
          r.click(function () {
            e.recording.stop();
          }),
          e.on("recording:stopped", function () {
            (ltiOpic.audioInputDevice.disableSensor(),
              (audioQuality = e.response.audioQualityCheck()));
            var t = 0.05;
            ("iOS" == ltiOpic.settings.deviceInfo.os && (t = 0.025),
              $("#test_clippingSamples").html(
                audioQuality.detail.numberOfClippingSamples,
              ),
              $("#test_rmsEnergy").html(audioQuality.detail.maxRmsEnergy),
              audioQuality.detail.numberOfClippingSamples > 40 &&
              !ltiOpic.settings.micError
                ? (g.html(
                    ltiOpic.settings.text.tooMuchNoise +
                      " <br />" +
                      ltiOpic.settings.text.recordAgain,
                  ),
                  h.modal("show"),
                  a.prop("disabled", !1),
                  a.show())
                : audioQuality.detail.maxRmsEnergy < t &&
                    !ltiOpic.settings.micError
                  ? (g.html(
                      ltiOpic.settings.text.tooLow +
                        " <br />" +
                        ltiOpic.settings.text.recordAgain,
                    ),
                    h.modal("show"),
                    a.prop("disabled", !1),
                    a.show())
                  : (ltiOpic.demo &&
                    "function" == typeof ltiOpic.demo &&
                    ltiOpic.demo()
                      ? setTimeout(function () {
                          (l.prop("disabled", !1), d.hide());
                        }, 1500)
                      : questionsApp.save(i),
                    a.prop("disabled", !0),
                    a.show(),
                    d.show()),
              r.prop("disabled", !0),
              r.hide(),
              p.hide());
          }),
          l.click(function () {
            (l.prop("disabled", !0),
              u.prop("disabled", !1),
              r.prop("disabled", !1),
              e.response.play(),
              e.on("playback:complete", function () {
                (l.toggleClass("waiting-btn", "play-sound-btn"),
                  l.html(
                    "<span>" + ltiOpic.settings.text.playRecording + "</span>",
                  ),
                  $(".lrn_position.lrn_wfblock").width("0px"),
                  $("#btnReplay").show());
              }));
          }));
        var i = {
          success: function (e) {
            (l.prop("disabled", !1), d.hide());
          },
          error: function (e) {},
          progress: function (e) {},
        };
      },
      errorListener: function (e) {
        var i = e.code.toString();
        "10011" == i || "10012" == i
          ? v()
          : "10015" == i || "10018" == i
            ? ($("#setupArea").hide(),
              $("#btnNext").hide(),
              $("#browserNotSupportedMessage").show())
            : ($("#setupArea").hide(),
              $("#btnNext").hide(),
              $("#serverErrorMessage").show());
      },
      saveSuccess: function (e) {},
      prevent_flash: !0,
    };
    window.questionsApp = LearnosityApp.init(
      ltiOpic.settings.learnosity.signedRequest,
      i,
    );
  }
  function b() {
    i.on("ended", function () {
      (a.prop("disabled", !1), $("#btnReplay").show(), i.hasStarted(!1));
      (["Chrome Dev", "Chrome"].includes(ltiOpic.settings.deviceInfo.browser) &&
        (this.src({
          type: "application/x-mpegURL",
          src: ltiOpic.settings.video.src,
        }),
        this.poster(ltiOpic.settings.video.poster)),
        this.bigPlayButton.addClass("vjs-refresh"),
        i.bigPlayButton.on("click", function () {
          i.playlist.first();
        }));
    });
  }
  function f() {
    ($("#setupArea").show(),
      $("#micAccessMessage").hide(),
      clearTimeout(n.showMicAccessTimeout),
      (n.showMicAccessTimeout = null));
  }
  function v() {
    (clearTimeout(n.showMicAccessTimeout),
      (n.showMicAccessTimeout = null),
      $("#setupArea").hide(),
      $("#micAccessMessage").hide(),
      $("#noMicMessage").show(),
      $("#btnNext").hide());
  }
  function w() {
    navigator.mediaDevices.enumerateDevices().then(function (i) {
      var t = !1;
      (i.forEach(function (e) {
        e.label == n.audioInputDevice && (t = !0);
      }),
        t || ((ltiOpic.settings.micError = !0), e.recording.stop(), v()));
    });
  }
  ((i = videojs("setup-video", {
    controls: !1,
    autoplay: !1,
    preload: "auto",
    html5: { hls: { overrideNative: !0 } },
  })),
    (t = [
      {
        sources: [
          { type: "application/x-mpegURL", src: ltiOpic.settings.video.src },
        ],
        poster: ltiOpic.settings.video.poster,
      },
    ]),
    i.playlist(t),
    i.playlist.autoadvance(0),
    1 === (o = t.length)
      ? b()
      : o >= 1 &&
        i.on("playlistitem", function () {
          ((s = this.playlist.currentItem()), o === s + 1 && b());
        }),
    i.removeChild("ControlBar"),
    m(),
    (navigator.mediaDevices.ondevicechange = function (e) {
      w();
    }),
    $(".refreshButton").on("click", function () {
      location.reload();
    }),
    $(".logoutButton").on("click", function () {
      window.location = "/logout";
    }),
    $("#btnPlay").on("click", function () {
      ($("#btnPlay").hide(), i.play());
    }),
    $("#btnReplay").on("click", function () {
      ($("#btnReplay").hide(), i.play(), a.prop("disabled", !0));
    }));
});
