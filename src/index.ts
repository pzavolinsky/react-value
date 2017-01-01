import { Component, ComponentClass } from 'react';

export interface ValueEvent<VALUE> {
  target: {
    value: VALUE
  }
}

export interface OnChange<VALUE> {
  (e:ValueEvent<VALUE>):void
}

export interface ValueProps<VALUE> {
  value: VALUE
  onChange: OnChange<VALUE>
}

export interface ValueFnProps<VALUE> extends ValueProps<VALUE> {
  setValue:
    (value:VALUE) => void
  mergeValue:
    <KEY extends keyof VALUE>(propName:KEY, propValue:VALUE[KEY]) => void
  onChangeMergeValue:
    <KEY extends keyof VALUE>(propName:KEY) => OnChange<VALUE[KEY]>
}

export interface ValueFn<VALUE, PROPS> {
  (props:ValueFnProps<VALUE> & PROPS):JSX.Element
}

export class ValueComponent<VALUE, PROPS>
  extends Component<ValueProps<VALUE> & PROPS, {}> {
  private mergeValueCache: any = {};
  setValue(value:VALUE) {
    const { onChange } = this.props;
    onChange({ target: { value } });
  }
  mergeValue<KEY extends keyof VALUE>(propName:KEY, propValue:VALUE[KEY]) {
    this.setValue({
      ...(this.props.value as any),
      [propName as string]: propValue
    });
  }
  onChangeMergeValue<KEY extends keyof VALUE>(
    propName:KEY
  ):OnChange<VALUE[KEY]> {
    return this.mergeValueCache[propName]
      || (this.mergeValueCache[propName] =
        (e:ValueEvent<VALUE[KEY]>) => this.mergeValue(propName, e.target.value)
      );
  }
}

export function valueComponent<VALUE, PROPS>(
  compFn:ValueFn<VALUE, PROPS>
):ComponentClass<ValueProps<VALUE> & PROPS> {
  return class FnValueComponent extends ValueComponent<VALUE, PROPS> {
    constructor(props:ValueProps<VALUE> & PROPS, ctx:any) {
      super(props, ctx);
      this.setValue = this.setValue.bind(this);
      this.mergeValue = this.mergeValue.bind(this);
      this.onChangeMergeValue = this.onChangeMergeValue.bind(this);
    }
    render() {
      return compFn({
        ...this.props as any,
        setValue: this.setValue,
        mergeValue: this.mergeValue,
        onChangeMergeValue: this.onChangeMergeValue
      });
    }
  };
}
