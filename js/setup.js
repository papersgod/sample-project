$(function () {
  // ─── State ──────────────────────────────────────────────────────────────────
  var videoPlayer,        // video.js instance
    playlistLength,       // number of playlist items
    playlistIndex,        // current playlist index
    state = {},           // misc state (timers, device label, etc.)
    micGranted = false,   // whether mic permission has been granted

    // Native recording state
    mediaRecorder = null,
    audioChunks = [],
    audioBlob = null,
    audioObjectUrl = null,
    audioElement = null,  // <audio> element used for playback

    // jQuery element shortcuts
    $start = $("#start"),
    $stop = $("#stop"),
    $view = $("#view"),
    $recordingStatus = $("#recordingStatus"),
    $uploadingAlert = $("#uploading-alert"),
    $btnNext = $("#btnNext"),
    $errorModal = $("#errorModal"),
    $errorBody = $("#errorModal .modal-body");

  // ─── Audio quality helpers (replaces Learnosity audioQualityCheck) ──────────

  /**
   * Decode an AudioBlob and return { numberOfClippingSamples, maxRmsEnergy }.
   * Mirrors the metrics Learnosity exposed on e.response.audioQualityCheck().
   */
  function analyzeAudioBlob(blob, callback) {
    var fileReader = new FileReader();
    fileReader.onload = function (ev) {
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.decodeAudioData(ev.target.result, function (buffer) {
        var channelData = buffer.getChannelData(0); // analyse first channel
        var frameCount = channelData.length;

        var clippingCount = 0;
        var maxRms = 0;

        // Walk through in 1024-sample windows for RMS; count |sample| >= 0.99 as clipping
        var windowSize = 1024;
        for (var i = 0; i < frameCount; i += windowSize) {
          var end = Math.min(i + windowSize, frameCount);
          var sumSq = 0;
          for (var j = i; j < end; j++) {
            var s = channelData[j];
            if (Math.abs(s) >= 0.99) clippingCount++;
            sumSq += s * s;
          }
          var rms = Math.sqrt(sumSq / (end - i));
          if (rms > maxRms) maxRms = rms;
        }

        audioCtx.close();
        callback({
          detail: {
            numberOfClippingSamples: clippingCount,
            maxRmsEnergy: maxRms,
          },
        });
      }, function () {
        // decode error — treat as silent recording
        callback({ detail: { numberOfClippingSamples: 0, maxRmsEnergy: 0 } });
      });
    };
    fileReader.readAsArrayBuffer(blob);
  }

  // ─── UI helpers ─────────────────────────────────────────────────────────────

  /** Show the main setup area and hide the mic-access overlay. */
  function showSetupArea() {
    $("#setupArea").show();
    $("#micAccessMessage").hide();
    clearTimeout(state.showMicAccessTimeout);
    state.showMicAccessTimeout = null;
  }

  /** Show "no microphone found" message and hide action buttons. */
  function showNoMicMessage() {
    clearTimeout(state.showMicAccessTimeout);
    state.showMicAccessTimeout = null;
    $("#setupArea").hide();
    $("#micAccessMessage").hide();
    $("#noMicMessage").show();
    $btnNext.hide();
  }

  // ─── Recording logic ─────────────────────────────────────────────────────────

  /**
   * Called when the recording stops (either by user or device-change watchdog).
   * Mirrors the Learnosity "recording:stopped" handler.
   */
  function onRecordingStopped() {
    ltiOpic.audioInputDevice.disableSensor();

    // Assemble the recorded audio into a single Blob
    audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    audioChunks = [];

    // Release any previous object URL
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    audioObjectUrl = URL.createObjectURL(audioBlob);

    // Run quality analysis
    analyzeAudioBlob(audioBlob, function (audioQuality) {
      var clippingSamples = audioQuality.detail.numberOfClippingSamples;
      var rmsEnergy = audioQuality.detail.maxRmsEnergy;

      // Expose for debugging (mirrors original DOM output)
      $("#test_clippingSamples").html(clippingSamples);
      $("#test_rmsEnergy").html(rmsEnergy);

      // iOS threshold is more lenient
      var rmsThreshold = ("iOS" === ltiOpic.settings.deviceInfo.os) ? 0.025 : 0.05;

      if (clippingSamples > 40 && !ltiOpic.settings.micError) {
        // Too much noise
        $errorBody.html(
          ltiOpic.settings.text.tooMuchNoise + " <br />" + ltiOpic.settings.text.recordAgain
        );
        $errorModal.modal("show");
        $start.prop("disabled", false).show();

      } else if (rmsEnergy < rmsThreshold && !ltiOpic.settings.micError) {
        // Too quiet
        $errorBody.html(
          ltiOpic.settings.text.tooLow + " <br />" + ltiOpic.settings.text.recordAgain
        );
        $errorModal.modal("show");
        $start.prop("disabled", false).show();

      } else {
        // Recording is good — enable playback / next
        if (ltiOpic.demo && typeof ltiOpic.demo === "function" && ltiOpic.demo()) {
          setTimeout(function () {
            $view.prop("disabled", false);
            $uploadingAlert.hide();
          }, 1500);
        } else {
          // Persist the audio blob via the app's save mechanism if available
          if (typeof ltiOpic.saveRecording === "function") {
            ltiOpic.saveRecording(audioBlob);
          }
          $view.prop("disabled", false);
          $uploadingAlert.hide();
        }
        $start.prop("disabled", true).show();
        $uploadingAlert.show();
      }

      $stop.prop("disabled", true).hide();
      $recordingStatus.hide();
    });
  }

  /**
   * Start recording using the MediaRecorder API.
   * Wires up the native recording and the Learnosity-compatible UI state.
   */
  function startRecording(stream) {
    // Attempt to use a broadly-supported audio format
    var mimeType = "";
    ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"].forEach(function (t) {
      if (!mimeType && MediaRecorder.isTypeSupported(t)) mimeType = t;
    });

    mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType: mimeType })
      : new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", function (e) {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    });

    mediaRecorder.addEventListener("stop", function () {
      onRecordingStopped();
    });

    mediaRecorder.start(100); // collect data every 100 ms

    // Drive the audio-level visualiser if the host provides one
    ltiOpic.audioInputDevice.enableSensor(stream);

    $recordingStatus.prop("hidden", false).show();
    $view.prop("disabled", true);
    $stop.prop("disabled", false).show();
    $start.hide();
  }

  /**
   * Called once the mic permission is already granted (or just granted).
   * Starts recording and updates UI.
   */
  function beginRecording(stream) {
    $("#btnReplay").hide();
    showSetupArea();
    micGranted = true;
    state.audioInputDevice = stream.getAudioTracks()[0].label;
    startRecording(stream);
  }

  // ─── Mic initialisation ──────────────────────────────────────────────────────

  function initMicButtons() {
    $start.click(function () {
      $("#btnReplay").hide();
      state.lastMicAccessRequest = Date.now();

      // Show mic-access overlay after 500 ms if permission dialog is slow
      state.showMicAccessTimeout = setTimeout(function () {
        $("#setupArea").hide();
        $("#micAccessMessage").show();
      }, 500);

      if (micGranted) {
        // Mic already unlocked — open a fresh stream and record
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(function (stream) {
            showSetupArea();
            startRecording(stream);
          })
          .catch(function () {
            showNoMicMessage();
          });
      } else {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(function (stream) {
            beginRecording(stream);
          })
          .catch(function () {
            checkDeviceSupport(function () {
              if (hasMicrophone) {
                if (!isMicrophoneAlreadyCaptured) {
                  clearTimeout(state.showMicAccessTimeout);
                  state.showMicAccessTimeout = null;
                  $("#setupArea").hide();
                  $("#micAccessMessage").hide();
                  $btnNext.hide();
                  if (Date.now() - state.lastMicAccessRequest < 400) {
                    $("#accessBlockedMessage").show();
                  } else {
                    $("#accessDeniedMessage").show();
                  }
                }
              } else {
                showNoMicMessage();
              }
            });
          });
      }
    });

    $stop.click(function () {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    });

    $view.click(function () {
      $view.prop("disabled", true);
      $btnNext.prop("disabled", false);
      $stop.prop("disabled", false);

      // Create / reuse a hidden <audio> element for playback
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);
      }

      audioElement.src = audioObjectUrl;

      // Mimic the waveform / progress bar behaviour the old code did with video.js
      $(".lrn_position.lrn_wfblock").width("0px");

      audioElement.onended = function () {
        $view.toggleClass("waiting-btn", false).toggleClass("play-sound-btn", true);
        $view.html("<span>" + ltiOpic.settings.text.playRecording + "</span>");
        $("#btnReplay").show();
      };

      audioElement.play();
    });
  }

  // ─── Error listener ──────────────────────────────────────────────────────────

  /**
   * Handle errors that previously came from Learnosity's errorListener.
   * Maps equivalent conditions to the same UI responses.
   */
  function handleAppError(code) {
    var c = code.toString();
    if (c === "10011" || c === "10012") {
      showNoMicMessage();
    } else if (c === "10015" || c === "10018") {
      $("#setupArea").hide();
      $btnNext.hide();
      $("#browserNotSupportedMessage").show();
    } else {
      $("#setupArea").hide();
      $btnNext.hide();
      $("#serverErrorMessage").show();
    }
  }

  // ─── Device-change watchdog ──────────────────────────────────────────────────

  function checkDeviceStillPresent() {
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      var found = false;
      devices.forEach(function (d) {
        if (d.label === state.audioInputDevice) found = true;
      });
      if (!found) {
        ltiOpic.settings.micError = true;
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        showNoMicMessage();
      }
    });
  }

  // ─── Video setup ──────────────────────────────────────────────────────────────

  function setupVideoEndBehaviour() {
    videoPlayer.on("ended", function () {
      $start.prop("disabled", false);
      $("#btnReplay").show();
      videoPlayer.hasStarted(false);

      if (["Chrome Dev", "Chrome"].includes(ltiOpic.settings.deviceInfo.browser)) {
        this.src({
          type: "application/x-mpegURL",
          src: ltiOpic.settings.video.src,
        });
        this.poster(ltiOpic.settings.video.poster);
      }

      videoPlayer.bigPlayButton.addClass("vjs-refresh");
      videoPlayer.bigPlayButton.on("click", function () {
        videoPlayer.playlist.first();
      });
    });
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  // Initialise video.js player
  videoPlayer = videojs("setup-video", {
    controls: false,
    autoplay: false,
    preload: "auto",
    html5: { hls: { overrideNative: true } },
  });

  var playlist = [
    {
      sources: [{ type: "application/x-mpegURL", src: ltiOpic.settings.video.src }],
      poster: ltiOpic.settings.video.poster,
    },
  ];

  videoPlayer.playlist(playlist);
  videoPlayer.playlist.autoadvance(0);

  playlistLength = playlist.length;
  if (playlistLength === 1) {
    setupVideoEndBehaviour();
  } else {
    videoPlayer.on("playlistitem", function () {
      playlistIndex = this.playlist.currentItem();
      if (playlistLength === playlistIndex + 1) {
        setupVideoEndBehaviour();
      }
    });
  }

  videoPlayer.removeChild("ControlBar");

  // Wire up mic buttons (replaces the Learnosity readyListener)
  initMicButtons();

  // Watch for device changes
  navigator.mediaDevices.ondevicechange = function () {
    checkDeviceStillPresent();
  };

  // Global button handlers
  $(".refreshButton").on("click", function () {
    location.reload();
  });

  $(".logoutButton").on("click", function () {
    window.location = "/logout";
  });

  $("#btnPlay").on("click", function () {
    $("#btnPlay").hide();
    videoPlayer.play();
  });

  $("#btnReplay").on("click", function () {
    $("#btnReplay").hide();
    videoPlayer.play();
    $start.prop("disabled", true);
  });
});
