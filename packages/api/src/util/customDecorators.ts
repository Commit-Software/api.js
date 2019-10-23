import {Api, ApiRx} from '@cennznet/api';
import createSubmittable from '@cennznet/api/submittable/createSubmittable';
import {SubmittableExtrinsic} from '@cennznet/api/submittable/types';
import {SubmittableExtrinsicFunction} from '@cennznet/api/types';
import {CodecArg} from '@cennznet/types/types';
import {CodecArg as Arg} from '@plugnet/types/types';

export function decorateExtrinsics(api: Api | ApiRx) {
    for (const sectionName of Object.keys(api.tx)) {
        for (const methodName of Object.keys(api.tx[sectionName])) {
            api.tx[sectionName][methodName] = decorateExtrinsic(api, api.tx[sectionName][methodName]);
        }
    }
}

function decorateExtrinsic(
    api: Api | ApiRx,
    method: SubmittableExtrinsicFunction<any>
): SubmittableExtrinsicFunction<any> {
    const newMethod = (...params: Array<CodecArg>) => {
        const extrinsic = method(...params);
        Object.defineProperty(extrinsic, 'fee', {
            value: sender => api.derive.fees.estimateFee(extrinsic, sender),
        });
        return extrinsic;
    };
    return (api as any).decorateFunctionMeta(method, newMethod);
}

export function decorateExtrinsicsSubmittables(api: Api | ApiRx) {
    const creator = createSubmittable(api.type, (api as any)._rx, (api as any).decorateMethod);
    for (const sectionName of Object.keys(api.tx)) {
        for (const methodName of Object.keys(api.tx[sectionName])) {
            api.tx[sectionName][methodName] = decorateExtrinsicsSubmittable(
                api,
                api.tx[sectionName][methodName],
                creator
            );
        }
    }
}

function decorateExtrinsicsSubmittable(
    api: Api | ApiRx,
    method: SubmittableExtrinsicFunction<any>,
    creator: any
): SubmittableExtrinsicFunction<any> {
    const decorated = (...params: Arg[]): SubmittableExtrinsic<any> => creator(method(...params));
    return (api as any).decorateFunctionMeta(method, decorated);
}
