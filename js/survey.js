var html = [],
  fullSubQuestionHtml = [],
  subQuestionsAdded = [],
  currentStepNum = 1,
  numOfSteps = 0;
function hideSubQuestions(e) {
  var t = $(".subQuestion-" + e + ":visible");
  t.length > 0 &&
    t.each(function (e) {
      ($(this).find("input:checked").prop("checked", !1),
        $(this).hide(),
        hideSubQuestions($(this).find("input").attr("name").split("-")[1]));
    });
}
function processQuestions() {
  for (var e = [], t = 0; t < questions.length; t++) {
    var s = questions[t].QuestionMaxSelection > 1 ? "checkbox" : "radio";
    if (
      (1 == questions[t].sequence &&
        ((e = (e = []).concat([
          "<li class='survey-question step-" +
            questions[t].sortOrder +
            " question-" +
            questions[t].QuestionId +
            "' data-question-min='" +
            questions[t].QuestionMinSelection +
            "'style='display:none'>",
        ])),
        questions[t].sortOrder > numOfSteps &&
          (numOfSteps = questions[t].sortOrder),
        "checkbox" == s &&
          1 == questions[t].sortorder &&
          null != questions[t].GroupInstructionText &&
          "" != questions[t].GroupInstructionText &&
          (e = e.concat([
            "<p class='instructions-survey'>" +
              questions[t].GroupInstructionText,
            "<span class='selection-count' style='float:right' data-group-min='" +
              questions[t].GroupMinSelection +
              "'>",
            "<span></span>",
            xmltxt_items_selected.replace("(currentnumber)", 0),
            "</span>",
            "</p>",
          ])),
        (e = e.concat([
          "  <p class='background-survey-question'>" +
            questions[t].QuestionText +
            "</p>",
        ])),
        "checkbox" == s &&
          (e = e.concat([
            "<div class='question-error-msg'>" +
              questions[t].QuestionValidationText +
              "</div>",
          ]))),
      (e = e.concat([
        "<div class='form-check'>",
        "  <label class='form-check-label'>",
        "    <input name='surveyOption-" +
          questions[t].QuestionId +
          "' data-option-id='" +
          questions[t].OptionId +
          "' data-subquestion-id='" +
          questions[t].MappedSubquestion +
          "' type='" +
          s +
          "' class='form-check-input'>",
        questions[t].OptionText,
        "  </label>",
        "</div>",
      ])),
      t + 1 != questions.length
        ? 1 == questions[t + 1].sequence &&
          ((e = e.concat(["</li>"])), (html = html.concat(e)))
        : ((e = e.concat("</li>")), (html = html.concat(e))),
      null != questions[t].MappedSubquestion)
    )
      processSubQuestions(
        subQuestions.filter(
          (e) => e.QuestionId == questions[t].MappedSubquestion,
        ),
        questions[t].QuestionId,
      );
  }
}
function processSubQuestions(e, t) {
  for (var s = [], n = [], i = 0; i < e.length; i++)
    if (-1 == subQuestionsAdded.indexOf(e[i].QuestionId)) {
      0 == i &&
        (s = s.concat([
          "<li class='survey-question question-" +
            e[i].QuestionId +
            " subQuestion-" +
            t +
            "' style='display:none'>",
          "  <p class='background-survey-question'>" +
            e[i].QuestionText +
            "</p>",
        ]));
      var u = e[i].QuestionMaxSelection > 1 ? "checkbox" : "radio";
      ((s = s.concat([
        "<div class='form-check'>",
        "  <label class='form-check-label'>",
        "    <input name='surveyOption-" +
          e[i].QuestionId +
          "' data-option-id='" +
          e[i].OptionId +
          "' data-subquestion-id='" +
          e[i].MappedSubquestion +
          "' type='" +
          u +
          "' class='form-check-input'>",
        e[i].OptionText,
        "  </label>",
        "</div>",
      ])),
        i + 1 == e.length &&
          ((s = s.concat("</li>")), subQuestionsAdded.push(e[i].QuestionId)),
        null != e[i].MappedSubquestion && n.push(e[i].MappedSubquestion));
    }
  if (((fullSubQuestionHtml = fullSubQuestionHtml.concat(s)), n.length > 0)) {
    t = e[0].QuestionId;
    for (var o = 0; o < n.length; o++) {
      processSubQuestions(
        (e = subQuestions.filter((e) => e.QuestionId == n[o])),
        t,
      );
    }
  }
}
function validateQuestions() {
  var e = !0;
  ($("li.survey-question:visible").each(function (t) {
    0 == $(this).find("input:checked").length && (e = !1);
  }),
    e
      ? $("#btnNext").prop("disabled", !1)
      : $("#btnNext").prop("disabled", !0));
}
function validateQuestionMins() {
  var e = !0;
  return (
    $(".survey-question:visible").each(function (t) {
      if ($(this).data("question-min") > $(this).find("input:checked").length) {
        e = !1;
        var s = $(this).find(".question-error-msg").first();
        s.show();
        var n = s.offset().top;
      }
      $("html, body").animate({ scrollTop: n }, 500);
    }),
    e
  );
}
function updateHeader() {
  $("#survey-progress").html(
    xmltxt_part_of
      .replace("(currentnumber)", currentStepNum)
      .replace("(totalnumber)", numOfSteps),
  );
}
function submitSurveyResponses() {
  var e = [];
  $("input:checked").each(function (t) {
    var s = $(this).attr("name").split("-")[1];
    e.push(s);
    var n = $(this).data("option-id");
    e.push(n);
  });
  var t = e.join(",") + ",",
    s = encodeURIComponent(t);
  ($.ajaxSetup({
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
  }),
    (request = $.ajax({
      url: "/save-survey",
      type: "POST",
      data: { responseList: s },
    })),
    request.done(function (e) {
      loadNextPage();
    }));
}
$(function () {
  ($("#btnNext").off("click"),
    $("#btnNext").click(function () {
      if (($(".sign-out").focus(), validateQuestionMins())) {
        if (currentStepNum == numOfSteps)
          ($(this).prop("disabled", !0), submitSurveyResponses());
        else {
          var e = ".step-" + (currentStepNum + 1);
          ($(".survey-question").hide(),
            $(e).show(),
            $(this).prop("disabled", !0),
            currentStepNum++,
            updateHeader());
        }
      }
    }),
    processQuestions(),
    (html = html.concat(fullSubQuestionHtml).join("\n")),
    $("#survey-questions").html(html),
    $(".step-1").show(),
    updateHeader(),
    $("input[type=radio]").change(function () {
      hideSubQuestions($(this).attr("name").split("-")[1]);
      var e = $(this).data("subquestion-id");
      null != e && $(".question-" + e).show();
      validateQuestions();
    }),
    $("input[type=checkbox]").change(function () {
      var e = $("input:checked:visible").length,
        t = $(".selection-count:visible").data("group-min");
      ($(".selection-count:visible").html(
        xmltxt_num_selected_items.replace("(currentnumber)", e),
      ),
        e >= t || null == t
          ? $("#btnNext").prop("disabled", !1)
          : $("#btnNext").prop("disabled", !0));
    }));
});
