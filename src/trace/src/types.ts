import type { DataQuery } from '@grafana/data';
export type TraceKeyValuePair = {
  key: string;
  type?: string;
  value: any;
};

export type TraceLink = {
  url: string;
  text: string;
};

export type TraceLog = {
  timestamp: number;
  fields: TraceKeyValuePair[];
};

export type TraceProcess = {
  serviceName: string;
  tags: TraceKeyValuePair[];
};

export type TraceSpanReference = {
  refType: 'CHILD_OF' | 'FOLLOWS_FROM';
  spanID: string;
  traceID: string;
};

export type Span = {
  spanID: string;
  traceID: string;
  processID: string;
  operationName: string;
  // Times are in microseconds
  startTime: number;
  duration: number;
  logs: TraceLog[];
  tags?: TraceKeyValuePair[];
  attributes?: TraceKeyValuePair[];
  references?: TraceSpanReference[];
  warnings?: null | string[];
  stackTraces?: string[];
  flags: number;
};

export type TraceResponse = {
  trace_id?: string;
  start_time?: number;
  trace_duration?: number;
  trace_name?: string;
  warnings?: null | string[];
  processes: Record<string, TraceProcess>;
  spans: Span[];
  traceID: string;
};

export type TraceQuery = {
  // undefined means the old behavior, showing only trace ID input
  queryType?: JaegerQueryType;
  app_name?: string;
  service?: string[];
  spans?: string[];
  // trace ID
  query?: string;
  tags?: string;
  min_duration?: string;
  max_duration?: string;
  limit?: number;
} & DataQuery;

export type JaegerQueryType = 'dependencyGraph' | 'search' | 'upload';

export type JaegerResponse = {
  data: TraceResponse[];
  total: number;
  limit: number;
  offset: number;
  errors?: null | string[];
};

/**
 * Type definition for service dependencies as returned by the dependencies API.
 */
export type JaegerServiceDependency = {
  parent: string;
  child: string;
  callCount: number;
};

export type FilterParam = {
  key: string;
  value: (string | boolean)[];
  operator: string;
};
