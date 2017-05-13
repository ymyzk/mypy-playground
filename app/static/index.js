(function () {
  "use strict";

  function send(data, callback, error) {
    var request = new XMLHttpRequest();
    request.open("POST", "/typecheck.json", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        var json;
        try {
          json = JSON.parse(request.response);
        } catch (e) {
          error("JSON.parse(): " + e);
          return;
        }
        if (request.status == 200) {
          callback(json);
        } else {
          error("unexpected status: " + request.status)
        }
      }
    };
    request.timeout = 10000;
    request.ontimeout = function() {
      error("timed out")
    };
    request.send(JSON.stringify(data));
  }

  function run() {
    var editor = ace.edit("editor");
    var $run = $("#run");
    var $result = $("#result");
    var data = {
      source: editor.getValue(),
      python_version: $("#python_version").val(),
    };
    $run.prop("disabled", true);
    $result.text("Running...");

    send(data, function(result) {
      $result.empty();
      if (result.exit_code === 0) {
        $result.append($("<span>").text("Success!!"));
      } else {
        $result.append($("<span>").text("Failed (exit code: " + result.exit_code + ")"));
      }
      $result.append("<hr>");
      $result.append($("<pre>").text(result.stdout));
      $result.append("<br>");
      $result.append($("<pre>").text(result.stderr));
      $run.prop("disabled", false);
    }, function(error) {
      $result.empty();
      $run.prop("disabled", false);
      $result.append($("<span>").text("Error"));
      $result.append("<hr>");
      $result.append($("<pre>").text(error));
    });
  }

  addEventListener("DOMContentLoaded", function() {
    var runButton = document.getElementById("run");

    runButton.onclick = function(e) {
      e.preventDefault();
      run();
    };

    var editor = ace.edit("editor");
    editor.getSession().setMode("ace/mode/python");
    editor.getSession().setUseSoftTabs(true);
  });
})();
