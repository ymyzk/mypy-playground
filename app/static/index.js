(function () {
  "use strict";

  function parseMessages(messages) {
    var types = {
      error: "error",
      note: "info"
    };
    var getType = function(level) {
      var type = types[level];
      return type ? type : "error";
    };
    var matcher = /^main\.py:(\d+): (\w+): (.+)/;
    return messages.split("\n").map(function(m) {
      var match = m.match(matcher);
      return match ? {
        row: match[1] - 1,
        type: getType(match[2]),
        text: match[3]
      } : null;
    }).filter(function (m) {
      return m !== null;
    });
  }

  function shareGist() {
    var editor = ace.edit("editor");
    var data = {
      description: "Shared via mypy Playground",
      public: true,
      files: {
        "main.py": {
          content: editor.getValue(),
        },
      },
    };

    var $result = $("#result");
    $result.empty();
    $result.text("Creating a gist...");

    axios.post("https://api.github.com/gists", data)
      .then(function(response) {
        if (response.status !== 201) {
          $result.empty();
          $result.text("Failed to create a gist. Status code: " + response.status);
          return;
        }
        var url = response.data.html_url;
        $result.empty();
        $result.append("<span>Gist URL: </span>");
        var $link = $("<a>");
        $link.attr("href", url);
        $link.attr("target", "_blank");
        $link.text(url);
        $result.append($link);
        $result.append("<hr>");
      })
      .catch(function(error) {
        $result.empty();
        $result.text("Failed to create a gist. " + error);
      });
  }

  function run() {
    var editor = ace.edit("editor");
    var $run = $("#run");
    var $result = $("#result");
    var data = {
      source: editor.getValue(),
      python_version: $("#python_version").val(),
    };
    $("input.mypy-options[type='checkbox']").map(function () {
      var $input = $(this);
      data[$input.prop("name")] = $input.prop("checked");
    });
    $run.prop("disabled", true);
    $result.text("Running...");

    axios.post("/typecheck.json", data, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30 * 1000,
      validateStatus: function(status) {
        return status === 200;
      },
    }).then(function(response) {
      var result = response.data;
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

      editor.getSession().clearAnnotations();
      editor.getSession().setAnnotations(parseMessages(result.stdout));
    }).catch(function(error) {
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

    $("#gist").click(function(e) {
      e.preventDefault();
      shareGist();
    });

    var editor = ace.edit("editor");
    editor.setValue($("#initial-code").text(), -1);
    editor.getSession().setMode("ace/mode/python");
    editor.getSession().setUseSoftTabs(true);
  });
})();
