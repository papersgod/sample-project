function submitSelfAssessmentResponse() {
  var e = $("input[name='sa-responses']:checked");
  if (e.length > 0) {
    var s = e.data("assessment-id"),
      t = e.data("option-id");
    ($.ajaxSetup({
      headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
    }),
      (request = $.ajax({
        url: "/save-self-assessment",
        type: "POST",
        data: { assessmentId: s, optionId: t },
      })),
      request.done(function (e) {
        loadNextPage();
      }));
  }
}
$(function () {
  ($("input[name='sa-responses']").change(function () {
    $("input[name='sa-responses']:checked").length > 0
      ? $("#btnNext").prop("disabled", !1)
      : $("#btnNext").prop("disabled", !0);
  }),
    $("#btnNext").off("click"),
    $("#btnNext").click(function () {
      ($("#btnNext").prop("disabled", !0), submitSelfAssessmentResponse());
    }));
});
