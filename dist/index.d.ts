/// <reference types="react" />
import { Component, ComponentClass } from 'react';
export interface ValueEvent<VALUE> {
    target: {
        value: VALUE;
    };
}
export interface OnChange<VALUE> {
    (e: ValueEvent<VALUE>): void;
}
export interface ValueProps<VALUE> {
    value: VALUE;
    onChange: OnChange<VALUE>;
}
export interface ValueFnProps<VALUE> extends ValueProps<VALUE> {
    setValue: (value: VALUE) => void;
    mergeValue: <KEY extends keyof VALUE>(propName: KEY, propValue: VALUE[KEY]) => void;
    onChangeMergeValue: <KEY extends keyof VALUE>(propName: KEY) => OnChange<VALUE[KEY]>;
}
export interface ValueFn<VALUE, PROPS> {
    (props: ValueFnProps<VALUE> & PROPS): JSX.Element;
}
export declare class ValueComponent<VALUE, PROPS> extends Component<ValueProps<VALUE> & PROPS, {}> {
    private mergeValueCache;
    setValue(value: VALUE): void;
    mergeValue<KEY extends keyof VALUE>(propName: KEY, propValue: VALUE[KEY]): void;
    onChangeMergeValue<KEY extends keyof VALUE>(propName: KEY): OnChange<VALUE[KEY]>;
}
export declare function valueComponent<VALUE, PROPS>(compFn: ValueFn<VALUE, PROPS>): ComponentClass<ValueProps<VALUE> & PROPS>;
