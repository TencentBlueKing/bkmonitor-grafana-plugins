import {
  type DataFrame,
  type DataQueryResponse,
  FieldType,
  MutableDataFrame,
  NodeGraphDataFrameFieldNames as Fields,
} from '@grafana/data';

import type { JaegerServiceDependency } from './types';

interface Node {
  [Fields.id]: string;
  [Fields.title]: string;
}

interface Edge {
  [Fields.id]: string;
  [Fields.target]: string;
  [Fields.source]: string;
  [Fields.mainStat]: number;
}

/**
 * Error schema used by the dependencies API.
 */
interface JaegerDependenciesResponseError {
  code: number;
  msg: string;
}

interface JaegerDependenciesResponse {
  data?: {
    errors?: JaegerDependenciesResponseError[];
    data?: JaegerServiceDependency[];
  };
}

/**
 * Transforms a dependencies API response to a Grafana {@link DataQueryResponse}.
 * @param response Raw response data from the API proxy.
 */
export function mapJaegerDependenciesResponse(response: JaegerDependenciesResponse): DataQueryResponse {
  const errors = response?.data?.errors;
  if (errors) {
    return {
      data: [],
      errors: errors.map((e: JaegerDependenciesResponseError) => ({ message: e.msg, status: e.code })),
    };
  }
  const dependencies = response?.data?.data;
  if (dependencies) {
    return {
      data: convertDependenciesToGraph(dependencies),
    };
  }

  return { data: [] };
}

/**
 * Converts a list of  service dependencies to a Grafana {@link DataFrame} array suitable for the node graph panel.
 * @param dependencies List of  service dependencies as returned by the  dependencies API.
 */
function convertDependenciesToGraph(dependencies: any[]): DataFrame[] {
  const servicesByName = new Map<string, Node>();
  const edges: Edge[] = [];

  for (const dependency of dependencies) {
    addServiceNode(dependency.parent, servicesByName);
    addServiceNode(dependency.child, servicesByName);

    edges.push({
      [Fields.id]: `${dependency.parent}--${dependency.child}`,
      [Fields.target]: dependency.child,
      [Fields.source]: dependency.parent,
      [Fields.mainStat]: dependency.callCount,
    });
  }

  const nodesFrame = new MutableDataFrame({
    fields: [
      { name: Fields.id, type: FieldType.string },
      { name: Fields.title, type: FieldType.string },
    ],
    meta: {
      preferredVisualisationType: 'nodeGraph',
    },
  });

  const edgesFrame = new MutableDataFrame({
    fields: [
      { name: Fields.id, type: FieldType.string },
      { name: Fields.target, type: FieldType.string },
      { name: Fields.source, type: FieldType.string },
      { name: Fields.mainStat, type: FieldType.string, config: { displayName: 'Call count' } },
    ],
    meta: {
      preferredVisualisationType: 'nodeGraph',
    },
  });

  for (const node of servicesByName.values()) {
    nodesFrame.add(node);
  }

  for (const edge of edges) {
    edgesFrame.add(edge);
  }

  return [nodesFrame, edgesFrame];
}

/**
 * 一个便捷函数，用于在依赖关系图中注册一个服务节点。
 * @param service 要注册的服务名称。
 * @param servicesByName 一个以服务名称为键的服务节点映射。
 */
function addServiceNode(service: string, servicesByName: Map<string, Node>) {
  if (!servicesByName.has(service)) {
    servicesByName.set(service, {
      [Fields.id]: service,
      [Fields.title]: service,
    });
  }
}
