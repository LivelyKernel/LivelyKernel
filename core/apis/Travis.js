module('apis.Travis').requires('lively.Network').toRun(function() {

Object.extend(apis.Travis, {

  fetchTravisBuildReportFor: function(project) {
    // project = {
    //   name: STRING
    //  ,branch: STRING
    //  ,repo: STRING
    //  [,repoName: STRING]
    // }

    return new Promise((resolve, reject) => {
      // 1. find name of project repository
      var repoName = project.repoName
      if (!repoName) {
        var match = project.repo && project.repo.match(/[^\/]+\/[^\/]+$/);
        repoName = match && match[0];
      }
      if (!repoName) throw new Error("Cannot read repo of project " + project);
      project = lively.lang.obj.merge(project, {repoName: repoName});

      // 2. send request to travis API
      var url = `https://api.travis-ci.org/repos/${repoName}/builds`;
      new window.WebResource(url).beAsync().get().whenDone((result, status) =>
        (status.isSuccess() ? resolve : reject)(lively.lang.obj.merge(project, {
          travisBuilds: status.isSuccess() ? JSON.parse(result) : status + "\n" + result})));

    }).then(project =>
      // 3. create travis report
      lively.lang.obj.merge(project, {travisReport: printLastTravisBuild(project)}));

    function printLastTravisBuild(project) {
      var builds = project.travisBuilds,
          build = builds && builds.length && builds.detect(b => b.branch === project.branch) || builds.first();
      if (!build) return `no travis build result for ${project.name}:${project.branch}`;
      var status = "unknown";
      if (build.state !== 'finished') status = "running";
      else if (build.result === 0) status = "success";
      else if (build.result === 1) status = "failure";
      else if (build.result === 2) status = "errored";
      var duration = new Date(build.started_at).relativeTo(new Date(build.finished_at)),
          when = new Date(build.started_at).relativeTo(new Date()),
          commit = `[${build.commit.slice(0,5)}] ${build.message}`;
      return `travis build #${build.number} of ${project.repoName}:\n  status: ${status}\n  ran: ${when} ago\n  commit: ${commit}\n  duration: ${duration}`;
    }
  },

  showTravisBuildReportForProjects: function(projects) {
    // lively.ide.withLoadingIndicatorDo(label, doFunc)
    Promise.all(projects.map(apis.Travis.fetchTravisBuildReportFor))
      .then(projects => $world.addCodeEditor({
        title: "travis build results",
        content: projects.pluck("travisReport").join("\n\n"),
        textMode: "text",
        extent: lively.pt(580,500)
      }).getWindow().comeForward())
      .catch(err => $world.inform(String(err)));
  }

});

}) // end of module
