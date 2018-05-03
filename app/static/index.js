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

  function parseQueryParameters() {
    var a = window.location.search.substr(1).split("&");
    if (a === "") return {};
    var b = {};
    for (var i = 0; i < a.length; i++) {
      var p = a[i].split("=");
      if (p.length != 2) continue;
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
  }

  function shareGist() {
    var editor = ace.edit("editor");
    var data = {
      source: editor.getValue(),
    };

    var $result = $("#result");
    $result.empty();
    $result.text("Creating a gist...");

    axios.post("/gist", data)
      .then(function(response) {
        if (response.status !== 201) {
          $result.empty();
          $result.text("Failed to create a gist. Status code: " + response.status);
          return;
        }
        var url = response.data.url;
        $result.empty();
        $result.append("<span>Gist URL: </span>");
        var $link = $("<a>");
        $link.attr("href", url);
        $link.attr("target", "_blank");
        $link.text(url);
        $result.append($link);
        url = "https://play-mypy.ymyzk.com/?gist=" + response.data.id;
        $result.append("<br><span>Playground URL: </span>");
        $link = $("<a>");
        $link.attr("href", url);
        $link.text(url);
        $result.append($link);
        $result.append("<hr>");
      })
      .catch(function(error) {
        $result.empty();
        $result.text("Failed to create a gist. " + error);
      });
  }

  function fetchGist(gistId) {
    var editor = ace.edit("editor");
    var $result = $("#result");
    $result.empty();
    $result.text("Fetching a gist...");

    axios.get("https://api.github.com/gists/" + gistId)
      .then(function(response) {
        if (response.status !== 200) {
          $result.empty();
          $result.text("Failed to fetch a gist.");
          return;
        }
        if (!("main.py" in response.data.files)) {
          $result.empty();
          $result.text("'main.py' not found.");
          return;
        }

        editor.setValue(response.data.files["main.py"].content, -1);
        $result.empty();
        $result.text("Completed to fetch a Gist!");
      })
      .catch(function(error) {
        $result.empty();
        $result.text("Failed to fetch a gist. " + error);
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

    var queries = parseQueryParameters();
    if ("gist" in queries) {
      fetchGist(queries.gist);
    }
  });
})();
