function loadNextPage() {
  ($("#btnNext").prop("disabled", !0), $("#formNext").submit());
}
function detectFailedXHR(e) {}
$(function () {
  $("#btnNext").on("click", function () {
    loadNextPage();
  });
});
var ltiOpic = {
  settings: { mode: "setup", demo: !1 },
  config: function (e) {
    if (null !== e && "object" == typeof e)
      for (var n in e) this.settings[n] = e[n];
  },
  demo: function (e = null) {
    return (
      "boolean" == typeof e && (this.settings.demo = e),
      this.settings.demo
    );
  },
  mode: function (e = null) {
    switch (e) {
      case "setup":
        this.settings.mode = "setup";
        break;
      case "sample":
        this.settings.mode = "sample";
        break;
      case "test":
        this.settings.mode = "test";
    }
    return this.settings.mode;
  },
  audioInputDevice: {
    access: !1,
    name: null,
    connected: !1,
    error: function () {
      return !this.access || !this.connected;
    },
    sensor: null,
    enableSensor: function (e, n = ".block-mic-gauge") {
      var t = $(e).get(0);
      ($(n).removeClass("disable"),
        (this.sensor = new ResizeSensor(t, function () {
          var e = 100 - (t.clientHeight / t.parentNode.clientHeight) * 100;
          $(n + " .mic-gauge").height(e + "%");
        })));
    },
    disableSensor: function (e = ".block-mic-gauge") {
      ($(e + " .mic-gauge").height("0%"),
        $(e).addClass("disable"),
        this.sensor.detach(),
        (this.sensor = null));
    },
  },
  setAudioInputDevice: function (e) {
    ((this.audioInputDevice.name = e),
      (this.audioInputDevice.access = !0),
      (this.audioInputDevice.connected = !0));
  },
  confirmAudioInputDevice: function (e = Object) {
    var n = this;
    navigator.mediaDevices.enumerateDevices().then(function (t) {
      ((n.audioInputDevice.connected = !1),
        t.forEach(function (e) {
          e.label == n.audioInputDevice.name &&
            (n.audioInputDevice.connected = !0);
        }),
        n.audioInputDevice.connected
          ? e.onSuccess && e.onSuccess()
          : e.onError && e.onError());
    });
  },
  confirmMicAccess: function (e = Object) {
    var n = this;
    confirmMicAccess({
      onSuccess: function () {
        ((n.audioInputDevice.access = !0),
          e.onSuccess && "function" == typeof e.onSuccess && e.onSuccess());
      },
      onFailure: function () {
        ((n.audioInputDevice.access = !1),
          e.onFailure && "function" == typeof e.onFailure && e.onFailure());
      },
    });
  },
};
