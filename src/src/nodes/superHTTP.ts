import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeConnection,  
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Project,  
  Rivet
} from "@ironclad/rivet-core";



export type SuperHTTPNode = ChartNode<"superHTTP", SuperHTTPNodeData>;

export type SuperHTTPNodeData = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  useMethodInput?: boolean;

  url: string;
  useUrlInput?: boolean;

  headers: string;
  useHeadersInput?: boolean;

  body: string;
  useBodyInput?: boolean;

  errorOnNon200?: boolean;
  
  disableSSLVerification: boolean;
  useSSLVerificationInput?: boolean;  
};



export default function (rivet: typeof Rivet) {
  const nodeImpl: PluginNodeImpl<SuperHTTPNode> = {
    create(): SuperHTTPNode {
      const node: SuperHTTPNode = {      
        id: rivet.newId<NodeId>(),
        type: 'superHTTP',
        title: 'Http Call [Super]',
        visualData: {
          x: 0,
          y: 0,
          width: 250,
        },
        data: {
          method: 'GET',
          url: '',
          headers: '',
          body: '',
          disableSSLVerification: false,
        },
      };
      return node;      
    },

    getInputDefinitions(
      data: SuperHTTPNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project
    ): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      if (data.useMethodInput) {
        inputs.push({
          dataType: 'string',
          id: 'method' as PortId,
          title: 'Method',
        });
      }
  
      if (data.useUrlInput) {
        inputs.push({
          dataType: 'string',
          id: 'url' as PortId,
          title: 'URL',
        });
      }
  
      if (data.useHeadersInput) {
        inputs.push({
          dataType: 'object',
          id: 'headers' as PortId,
          title: 'Headers',
        });
      }
  
      if (data.useBodyInput) {
        inputs.push({
          dataType: 'string',
          id: 'req_body' as PortId,
          title: 'Body',
        });
      }
  
      if (data.useSSLVerificationInput) {
        inputs.push({
          dataType: 'boolean',
          id: 'disableSSLVerification' as PortId,
          title: 'Disable SSL Verification',
        });
      }
      return inputs;
    },

    getOutputDefinitions(
      _data: SuperHTTPNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project
    ): NodeOutputDefinition[] {
      return [
        {
          dataType: 'string',
          id: 'res_body' as PortId,
          title: 'Body',
        },
        {
          dataType: 'object',
          id: 'json' as PortId,
          title: 'JSON',
        },
        {
          dataType: 'number',
          id: 'statusCode' as PortId,
          title: 'Status Code',
        },
        {
          dataType: 'object',
          id: 'res_headers' as PortId,
          title: 'Headers',
        },
      ];
    },

    getUIData(): NodeUIData {
      return {
        contextMenuTitle: "HTTP Call Node [Super]",
        group: ["Advanced"],
        infoBoxBody: "Perform HTTP calls with optional SSL verification disable.",
        infoBoxTitle: "HTTP Call [Super]",
      };
    },

    getEditors(_data: SuperHTTPNodeData): EditorDefinition<SuperHTTPNode>[] {
      return [
        {
          type: 'dropdown',
          label: 'Method',
          dataKey: 'method',
          useInputToggleDataKey: 'useMethodInput',
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' }
          ]
        },
        {
          type: 'string',
          label: 'URL',
          dataKey: 'url',
          useInputToggleDataKey: 'useUrlInput'
        },
        {
          type: 'code',
          label: 'Headers',
          dataKey: 'headers',
          useInputToggleDataKey: 'useHeadersInput',
          language: 'json'
        },
        {
          type: 'code',
          label: 'Body',
          dataKey: 'body',
          useInputToggleDataKey: 'useBodyInput',
          language: 'json'
        },
        {
          type: 'toggle',
          label: 'Error on non-200 status code',
          dataKey: 'errorOnNon200',
        },        
        {
          type: 'toggle',
          label: 'Disable SSL Verification',
          dataKey: 'disableSSLVerification',
          useInputToggleDataKey: 'useSSLVerificationInput'
        }
      ];
    },
    
    getBody(data: SuperHTTPNodeData):  string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
        ${data.useMethodInput ? '(Method Using Input)' : data.method} ${
          data.useUrlInput ? '(URL Using Input)' : data.url
        } ${
          data.useHeadersInput
            ? '\nHeaders: (Using Input)'
            : data.headers.trim()
              ? `\nHeaders: ${data.headers}`
              : ''
        }${data.useBodyInput ? '\nBody: (Using Input)' : data.body.trim() ? `\nBody: ${data.body}` : ''}${
          data.disableSSLVerification ? '\nSSL Verification Disabled' : ''
        }
      `;
  },
  



    async process(data: SuperHTTPNodeData, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
      if (context.executor !== "nodejs") {
        throw new Error("This node can only be run using a nodejs executor.");
      }      
      
      let config = {
        method:'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: '',
        headers: {},
        body: '',
        errorOnNon200: false,
        disableSSLVerification: false,
      };

      config['method'] = data.useMethodInput ? inputs['method' as PortId]?.value as 'GET' | 'POST' | 'PUT' | 'DELETE' : data.method;
      config['url'] = data.useUrlInput ? inputs['url' as PortId]?.value as string : data.url;
      if (!config['url']) throw new Error("URL is required but was not provided.");
   
      if (data.useHeadersInput) {
        const headersInput = inputs['headers' as PortId];
        if (headersInput?.type === 'string') {
          config['headers'] = JSON.parse(headersInput!.value);
        } else if (headersInput?.type === 'object') {
          config['headers'] = headersInput!.value as Record<string, string>;
        }
      } else if (data.headers.trim()) {
        config['headers'] = JSON.parse(data.headers);
      }      

      if (data.useBodyInput) {
        const bodyInput = inputs['req_body' as PortId];
        if (bodyInput?.type === 'string') {
          config['body'] = bodyInput!.value;
        } else if (bodyInput?.type === 'object') {
          config['body'] = JSON.stringify(bodyInput!.value);
        }
      } else {
        config['body'] = data.body || '';
      }

      config['errorOnNon200'] = data.errorOnNon200 ? inputs['errorOnNon200' as PortId]?.value as boolean : data.errorOnNon200 || false;
      config['disableSSLVerification'] = data.useSSLVerificationInput ? inputs['disableSSLVerification' as PortId]?.value as boolean : data.disableSSLVerification;

      // IMPORTANT
      // It is important that you separate node-only plugins into two separately bundled parts:
      // 1. The isomorphic bundle, which contains the node definition and all the code here
      // 2. The node bundle, which contains the node entry point and any node-only code
      // You are allowed to dynamically import the node entry point from the isomorphic bundle (in the process function)
      const { runSuperHTTPNode } = await import("../nodeEntry");

      const result = await runSuperHTTPNode(config);      

      const output: Outputs = {
        ['statusCode' as PortId]: {
          type: 'number',
          value: result.statusCode || 0,
        },
        ['res_headers' as PortId]: {
          type: 'object',
          value: result.res_headers || {},
        },
      };

      output['res_body' as PortId] = {
        type: 'string',
        value: result.res_body || '',
      };
      
      if (result.res_headers['content-type']?.includes('application/json')) {
        const jsonData = JSON.parse(result.res_body);
        output['json' as PortId] = {
          type: 'object',
          value: jsonData,
        };
      } else {
        output['json' as PortId] = {
          type: 'control-flow-excluded',
          value: undefined,
        };
      }

      return output;

  },
  };

  return rivet.pluginNodeDefinition(nodeImpl, "SuperHTTP Call");
}
