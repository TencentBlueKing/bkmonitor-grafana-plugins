/* eslint-disable @typescript-eslint/naming-convention */
/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import Divider from 'antd/es/divider';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import React from 'react';

import { DIM_NULL_ID } from '../typings/datasource';
import {
  CONDITION,
  type ICommonItem,
  type IConditionItem,
  LOG_CONDITION_METHOD_LIST,
  type MetricDetail,
  NUMBER_CONDITION_METHOD_LIST,
  STRING_CONDITION_METHOD_LIST,
} from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { t } from 'common/utils/utils';

import type DataSource from '../datasource/datasource';
const { Option } = Select;
export interface IProps {
  datasource?: DataSource; // datasource实例
  metric: MetricDetail; // 指标
  // 监控条件变化
  onChange: (v: IConditionItem[], needQuery?: boolean) => void;
}
interface IState {
  dimensionValueMap: Record<string, ICommonItem[]>;
  metricMetaId: string;
}
export default class ConditionInput extends React.PureComponent<IProps, IState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      dimensionValueMap: {},
      metricMetaId: props.metric.curMetricId,
    };
    this.initDimensionValueMap();
  }
  /**
   * @description: 获取维度数据
   * @param {string} v 维度id
   * @return {*} 维度列表数据
   */
  getDimensionValue = async (v: string): Promise<Record<string, ICommonItem[]>> => {
    let list = [];
    if (!v) return {};
    if (this.props.datasource) {
      const { data_label, data_source_label, data_type_label, metric_field, result_table_id } = this.props.metric;
      list = await this.props.datasource.getNewDimensionValue({
        dataLabel: data_label || undefined,
        dataSourceLabel: data_source_label,
        dataTypeLabel: data_type_label,
        field: v,
        metricField: metric_field,
        resultTableId: result_table_id,
      });
    }
    return { [v]: list || [] };
  };
  /**
   * @description: 监控条件方法列表
   * @param {string} keyVal 维度
   * @return {*}
   */
  getMethodList = (keyVal: string) => {
    const { metric } = this.props;
    const dimensionItem = metric.dimensions?.find?.(item => item.id === keyVal);
    const type = dimensionItem?.type || '';
    const list = metric.metricMetaId === 'bk_log_search|log' ? LOG_CONDITION_METHOD_LIST : [];
    if (type === 'number') {
      return [...list, ...NUMBER_CONDITION_METHOD_LIST];
    }
    return [...list, ...STRING_CONDITION_METHOD_LIST];
  };
  handleAddClick = (index: number) => {
    const { agg_condition } = this.props.metric;
    const list = agg_condition.slice();
    list.splice(index, 1, {
      key: '',
    } as any);
    this.props.onChange(list, false);
  };
  handleConditionChange = (v: string, index: number) => {
    this.handleCommonChange(index, 'condition', v);
  };
  handleConditionKeyDown = (e: any, index: number) => {
    if (
      e.key === 'Enter' &&
      e.target.value &&
      !this.props.metric.dimensions.some(item => item.id === e.target.value || item.name === e.target.value)
    ) {
      const dimension = e.target.value;
      this.props.metric.dimensions.push({ id: dimension, is_dimension: true, name: dimension });
      this.handleKeyChange(e.target.value, index);
    }
  };
  handleDeleteKey = (index: number) => {
    const { agg_condition } = this.props.metric;
    const list = agg_condition.slice();
    if (index === list.length - 1) {
      list.splice(index, 1, {} as any);
    } else {
      if (list[index + 1].condition && (list[index - 1]?.condition || index === 0)) {
        const { condition, ...item } = list[index + 1];
        list[index + 1] = item;
      }
      list.splice(index, 1);
    }
    this.props.onChange(list);
  };
  /**
   * @description: 维度变化触发事件
   * @param {string} v 维度
   * @param {number} index 索引
   * @return {*}
   */
  handleKeyChange = async (v: string, index: number) => {
    const { agg_condition } = this.props.metric;
    this.props.onChange(
      agg_condition.map((item, i) => {
        if (i === index) {
          if (item.key !== v) {
            return {
              ...item,
              key: v,
              method: this.getMethodList(v)[0].id,
              value: [],
              ...(i > 0 ? { condition: 'and' } : {}),
            };
          }
          return {
            ...item,
            key: v,
          };
        }
        return item;
      }),
    );
    if (this.state.dimensionValueMap[v] || !v) return;
    const data = await this.getDimensionValue(v);
    this.setState({
      dimensionValueMap: {
        ...this.state.dimensionValueMap,
        ...data,
      },
    });
  };
  handleKeyVisibleChange = (open: boolean, index: number) => {
    if (!open) {
      setTimeout(() => {
        const { agg_condition } = this.props.metric;
        if (agg_condition[index].key === '') {
          const list = agg_condition.slice();
          list[index] = {} as any;
          this.props.onChange(list, false);
        }
      }, 20);
    }
  };
  /**
   * @description: 监控条件方法触发
   * @param {string} v 方法
   * @param {number} index 索引
   * @return {*}
   */
  handleMethodChange = (v: string, index: number) => {
    this.handleCommonChange(index, 'method', v);
  };
  /**
   * @description: 监控条件值变化触发
   * @param {string} v 监控条件
   * @param {number} index 索引
   * @return {*}
   */
  handleValueChange = (v: string[], index: number) => {
    const { agg_condition } = this.props.metric;
    const param = agg_condition.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          value: v,
        };
      }
      return item;
    });
    if (index === agg_condition.length - 1) {
      param.push({} as any);
    }
    this.props.onChange(param);
  };
  handleValueConditionKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  componentDidUpdate() {
    if (this.props.metric?.curMetricId && this.state.metricMetaId !== this.props.metric.curMetricId) {
      this.setState({
        dimensionValueMap: {},
        metricMetaId: this.props.metric.curMetricId,
      });
      this.initDimensionValueMap();
    }
  }
  /**
   * @description: 修改监控条件
   * @param {number} index 索引
   */
  handleCommonChange<T extends IConditionItem, K extends keyof T>(index: number, name: K, v: T[K]) {
    const { agg_condition } = this.props.metric;
    this.props.onChange(
      agg_condition.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [name]: v,
          };
        }
        return item;
      }),
    );
  }
  /**
   * @description: 初始化维度列表
   * @param {*}
   * @return {*}
   */
  async initDimensionValueMap() {
    const { agg_condition: condition } = this.props.metric;
    if (condition.length && condition[0].key) {
      const promiseList = condition.filter(item => item.key).map(item => this.getDimensionValue(item.key));
      const data = await Promise.all(promiseList);
      this.setState({
        dimensionValueMap: data.reduce((pre, cur) => ({ ...pre, ...cur }), {}),
      });
    }
  }
  render(): JSX.Element {
    const { dimensionValueMap } = this.state;
    const {
      metric: { agg_condition, dimensions },
    } = this.props;
    const needNUll = (key: string) => {
      const item = dimensions?.find(item => item.id === key);
      if (!item) return true;
      return typeof item.type === 'undefined' || item.type === 'string';
    };

    const getMaxWidth = (list: ICommonItem[]) =>
      Math.max(list?.reduce((max, cur) => Math.max(max, +cur?.name?.length), 1) * 10, 100);
    return (
      <div className='condition-input'>
        <LanguageContext.Consumer>
          {({ language }) =>
            agg_condition.map((item, index) => [
              item?.condition && (
                <Select
                  key={`condition-${index}-${item.key}`}
                  className='condition-input-condition'
                  defaultValue={item.condition}
                  dropdownMatchSelectWidth={100}
                  showArrow={false}
                  onChange={v => this.handleConditionChange(v, index)}
                >
                  {CONDITION?.map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>
              ),
              typeof item.key !== 'undefined' ? (
                <Select
                  key={`key-${JSON.stringify(item || {})}-${item.key}`}
                  dropdownRender={(menu): JSX.Element =>
                    item.value ? (
                      <div>
                        {menu}
                        <Divider style={{ margin: '0' }} />
                        <div
                          className='key-del'
                          onClick={(): void => this.handleDeleteKey(index)}
                        >
                          <CloseCircleOutlined style={{ marginRight: '5px' }} />
                          {t('删除', language)}
                        </div>
                      </div>
                    ) : (
                      menu
                    )
                  }
                  autoFocus={true}
                  className='condition-input-key'
                  defaultOpen={item.key === ''}
                  defaultValue={item.key || ''}
                  dropdownMatchSelectWidth={140}
                  placeholder={t('请选择', language)}
                  showArrow={false}
                  showSearch
                  onChange={(v: string) => this.handleKeyChange(v, index)}
                  onDropdownVisibleChange={v => this.handleKeyVisibleChange(v, index)}
                  onInputKeyDown={v => this.handleConditionKeyDown(v, index)}
                >
                  {dimensions?.map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      <Tooltip
                        placement='right'
                        title={dim.id}
                      >
                        <div>{dim.name || dim.id}</div>
                      </Tooltip>
                    </Option>
                  ))}
                </Select>
              ) : (
                <span
                  key={`add-${index}`}
                  className='condition-input-add'
                  onClick={() => this.handleAddClick(index)}
                >
                  <PlusOutlined className='add-icon' />
                </span>
              ),
              item?.key && [
                <Select
                  key={`method-${JSON.stringify(item || {})}-${item.key}`}
                  className='condition-input-method'
                  defaultValue={item.method}
                  dropdownMatchSelectWidth={80}
                  showArrow={false}
                  onChange={v => this.handleMethodChange(v, index)}
                >
                  {this.getMethodList(item.key).map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>,
                <Select
                  key={`value-${JSON.stringify(item || {})}-${item.key}`}
                  dropdownStyle={{
                    display: dimensionValueMap[item.key]?.length < 1 ? 'none' : '',
                    minWidth: `${getMaxWidth(dimensionValueMap[item.key])}px`,
                    width: `${getMaxWidth(dimensionValueMap[item.key])}px`,
                  }}
                  autoFocus={true}
                  className='condition-input-value'
                  defaultValue={item.value}
                  dropdownMatchSelectWidth={true}
                  mode='tags'
                  placeholder={t('请选择', language)}
                  showArrow={false}
                  tokenSeparators={[',', '|', '\n', ' ', '\r\n', '\r']}
                  onChange={v => this.handleValueChange(v, index)}
                  onInputKeyDown={v => this.handleValueConditionKeyDown(v)}
                >
                  {needNUll(item.key) && (
                    <Option
                      key={DIM_NULL_ID}
                      value={DIM_NULL_ID}
                    >
                      {t('- 空 -')}
                    </Option>
                  )}
                  {dimensionValueMap[item.key]?.map?.(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>,
              ],
            ])
          }
        </LanguageContext.Consumer>
      </div>
    );
  }
}
