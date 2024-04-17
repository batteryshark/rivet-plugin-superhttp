// src/nodes/superHTTP.ts
function superHTTP_default(rivet) {
  const nodeImpl = {
    create() {
      const node = {
        id: rivet.newId(),
        type: "superHTTP",
        title: "Http Call [Super]",
        visualData: {
          x: 0,
          y: 0,
          width: 250
        },
        data: {
          method: "GET",
          url: "",
          headers: "",
          body: "",
          disableSSLVerification: false
        }
      };
      return node;
    },
    getInputDefinitions(data, _connections, _nodes, _project) {
      const inputs = [];
      if (data.useMethodInput) {
        inputs.push({
          dataType: "string",
          id: "method",
          title: "Method"
        });
      }
      if (data.useUrlInput) {
        inputs.push({
          dataType: "string",
          id: "url",
          title: "URL"
        });
      }
      if (data.useHeadersInput) {
        inputs.push({
          dataType: "object",
          id: "headers",
          title: "Headers"
        });
      }
      if (data.useBodyInput) {
        inputs.push({
          dataType: "string",
          id: "req_body",
          title: "Body"
        });
      }
      if (data.useSSLVerificationInput) {
        inputs.push({
          dataType: "boolean",
          id: "disableSSLVerification",
          title: "Disable SSL Verification"
        });
      }
      return inputs;
    },
    getOutputDefinitions(_data, _connections, _nodes, _project) {
      return [
        {
          dataType: "string",
          id: "res_body",
          title: "Body"
        },
        {
          dataType: "object",
          id: "json",
          title: "JSON"
        },
        {
          dataType: "number",
          id: "statusCode",
          title: "Status Code"
        },
        {
          dataType: "object",
          id: "res_headers",
          title: "Headers"
        }
      ];
    },
    getUIData() {
      return {
        contextMenuTitle: "HTTP Call Node [Super]",
        group: ["Advanced"],
        infoBoxBody: "Perform HTTP calls with optional SSL verification disable.",
        infoBoxTitle: "HTTP Call [Super]"
      };
    },
    getEditors(_data) {
      return [
        {
          type: "dropdown",
          label: "Method",
          dataKey: "method",
          useInputToggleDataKey: "useMethodInput",
          options: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "DELETE", value: "DELETE" }
          ]
        },
        {
          type: "string",
          label: "URL",
          dataKey: "url",
          useInputToggleDataKey: "useUrlInput"
        },
        {
          type: "code",
          label: "Headers",
          dataKey: "headers",
          useInputToggleDataKey: "useHeadersInput",
          language: "json"
        },
        {
          type: "code",
          label: "Body",
          dataKey: "body",
          useInputToggleDataKey: "useBodyInput",
          language: "json"
        },
        {
          type: "toggle",
          label: "Error on non-200 status code",
          dataKey: "errorOnNon200"
        },
        {
          type: "toggle",
          label: "Disable SSL Verification",
          dataKey: "disableSSLVerification",
          useInputToggleDataKey: "useSSLVerificationInput"
        }
      ];
    },
    getBody(data) {
      return rivet.dedent`
        ${data.useMethodInput ? "(Method Using Input)" : data.method} ${data.useUrlInput ? "(URL Using Input)" : data.url} ${data.useHeadersInput ? "\nHeaders: (Using Input)" : data.headers.trim() ? `
Headers: ${data.headers}` : ""}${data.useBodyInput ? "\nBody: (Using Input)" : data.body.trim() ? `
Body: ${data.body}` : ""}${data.disableSSLVerification ? "\nSSL Verification Disabled" : ""}
      `;
    },
    async process(data, inputs, context) {
      if (context.executor !== "nodejs") {
        throw new Error("This node can only be run using a nodejs executor.");
      }
      let config = {
        method: "GET",
        url: "",
        headers: {},
        body: "",
        errorOnNon200: false,
        disableSSLVerification: false
      };
      config["method"] = data.useMethodInput ? inputs["method"]?.value : data.method;
      config["url"] = data.useUrlInput ? inputs["url"]?.value : data.url;
      if (!config["url"])
        throw new Error("URL is required but was not provided.");
      if (data.useHeadersInput) {
        const headersInput = inputs["headers"];
        if (headersInput?.type === "string") {
          config["headers"] = JSON.parse(headersInput.value);
        } else if (headersInput?.type === "object") {
          config["headers"] = headersInput.value;
        }
      } else if (data.headers.trim()) {
        config["headers"] = JSON.parse(data.headers);
      }
      if (data.useBodyInput) {
        const bodyInput = inputs["req_body"];
        if (bodyInput?.type === "string") {
          config["body"] = bodyInput.value;
        } else if (bodyInput?.type === "object") {
          config["body"] = JSON.stringify(bodyInput.value);
        }
      } else {
        config["body"] = data.body || "";
      }
      config["errorOnNon200"] = data.errorOnNon200 ? inputs["errorOnNon200"]?.value : data.errorOnNon200 || false;
      config["disableSSLVerification"] = data.useSSLVerificationInput ? inputs["disableSSLVerification"]?.value : data.disableSSLVerification;
      const { runSuperHTTPNode } = await import("../dist/nodeEntry.cjs");
      const result = await runSuperHTTPNode(config);
      const output = {
        ["statusCode"]: {
          type: "number",
          value: result.statusCode || 0
        },
        ["res_headers"]: {
          type: "object",
          value: result.res_headers || {}
        }
      };
      output["res_body"] = {
        type: "string",
        value: result.res_body || ""
      };
      if (result.res_headers["content-type"]?.includes("application/json")) {
        const jsonData = JSON.parse(result.res_body);
        output["json"] = {
          type: "object",
          value: jsonData
        };
      } else {
        output["json"] = {
          type: "control-flow-excluded",
          value: void 0
        };
      }
      return output;
    }
  };
  return rivet.pluginNodeDefinition(nodeImpl, "SuperHTTP Call");
}

// src/index.ts
var initializer = (rivet) => {
  const node = superHTTP_default(rivet);
  const plugin = {
    // The ID of your plugin should be unique across all plugins.
    id: "rivet-plugin-superhttp",
    // The name of the plugin is what is displayed in the Rivet UI.
    name: "SuperHTTP Plugin",
    // Define all configuration settings in the configSpec object.
    configSpec: {},
    // Define any additional context menu groups your plugin adds here.
    contextMenuGroups: [
      //  {id: "advanced",label: "Advanced",},
    ],
    // Register any additional nodes your plugin adds here. This is passed a `register`
    // function, which you can use to register your nodes.
    register: (register) => {
      register(node);
    }
  };
  return plugin;
};
var src_default = initializer;
export {
  src_default as default
};
