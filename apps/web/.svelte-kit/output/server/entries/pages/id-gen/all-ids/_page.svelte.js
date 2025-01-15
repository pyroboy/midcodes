import { q as onDestroy, g as getContext, y as setContext, c as create_ssr_component, s as subscribe, v as validate_component, B as get_current_component, k as compute_rest_props, a as add_attribute, e as escape, b as each } from "../../../../chunks/ssr.js";
import "mitt";
import * as THREE from "three";
import { PerspectiveCamera, REVISION, Vector3, Matrix4, Mesh, ShaderChunk } from "three";
import { d as derived, w as writable } from "../../../../chunks/index4.js";
import { shaderStructs, shaderIntersectFunction } from "three-mesh-bvh";
import "@threejs-kit/instanced-sprite-mesh";
import { P as PUBLIC_SUPABASE_URL } from "../../../../chunks/public.js";
import "jszip";
const watch = (stores, callback) => {
  const d = derived(stores, (values) => {
    return values;
  });
  let cleanupFn;
  const unsubscribe = d.subscribe(async (values) => {
    if (cleanupFn)
      cleanupFn();
    const fn = await callback(values);
    if (fn)
      cleanupFn = fn;
  });
  onDestroy(() => {
    unsubscribe();
    if (cleanupFn)
      cleanupFn();
  });
};
const defaultCamera = new PerspectiveCamera(75, 0, 0.1, 1e3);
defaultCamera.position.z = 5;
defaultCamera.lookAt(0, 0, 0);
function createObjectStore(object, onChange) {
  const objectStore = writable(object);
  let unwrappedObject = object;
  const unsubscribeObjectStore = objectStore.subscribe((o) => unwrappedObject = o);
  onDestroy(unsubscribeObjectStore);
  const set = (newObject) => {
    if (newObject?.uuid === unwrappedObject?.uuid)
      return;
    const oldObject = unwrappedObject;
    objectStore.set(newObject);
    onChange?.(newObject, oldObject);
  };
  const update = (callback) => {
    const newObject = callback(unwrappedObject);
    if (newObject?.uuid === unwrappedObject?.uuid)
      return;
    const oldObject = unwrappedObject;
    objectStore.set(newObject);
    onChange?.(newObject, oldObject);
  };
  return {
    ...objectStore,
    set,
    update
  };
}
const useThrelte = () => {
  const context = getContext("threlte");
  if (context === void 0) {
    throw new Error("No Threlte context found, are you using this hook inside of <Canvas>?");
  }
  return context;
};
const key = Symbol("threlte-hierarchical-parent-context");
const useParent = () => {
  return getContext(key);
};
const setParent = (context) => {
  return setContext(key, context);
};
const createParentContext = (ref) => {
  const context = createObjectStore(ref);
  setContext(key, context);
  return context;
};
const useHierarchicalObject = () => {
  return {
    onChildMount: getContext("threlte-hierarchical-object-on-mount"),
    onChildDestroy: getContext("threlte-hierarchical-object-on-destroy")
  };
};
const HierarchicalObject = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $parentStore, $$unsubscribe_parentStore;
  let { object = void 0 } = $$props;
  let { onChildMount = void 0 } = $$props;
  const onChildMountProxy = (child) => {
    onChildMount?.(child);
  };
  let { onChildDestroy = void 0 } = $$props;
  const onChildDestroyProxy = (child) => {
    onChildDestroy?.(child);
  };
  const { invalidate } = useThrelte();
  const parentStore = useParent();
  $$unsubscribe_parentStore = subscribe(parentStore, (value) => $parentStore = value);
  let { parent = $parentStore } = $$props;
  const parentCallbacks = useHierarchicalObject();
  if (object) {
    parentCallbacks.onChildMount?.(object);
    invalidate();
  }
  const objectStore = createObjectStore(object, (newObject, oldObject) => {
    if (oldObject) {
      parentCallbacks.onChildDestroy?.(oldObject);
      invalidate();
    }
    if (newObject) {
      parentCallbacks.onChildMount?.(newObject);
      invalidate();
    }
  });
  onDestroy(() => {
    if (object) {
      parentCallbacks.onChildDestroy?.(object);
      invalidate();
    }
  });
  setContext("threlte-hierarchical-object-on-mount", onChildMountProxy);
  setContext("threlte-hierarchical-object-on-destroy", onChildDestroyProxy);
  setParent(objectStore);
  if ($$props.object === void 0 && $$bindings.object && object !== void 0) $$bindings.object(object);
  if ($$props.onChildMount === void 0 && $$bindings.onChildMount && onChildMount !== void 0) $$bindings.onChildMount(onChildMount);
  if ($$props.onChildDestroy === void 0 && $$bindings.onChildDestroy && onChildDestroy !== void 0) $$bindings.onChildDestroy(onChildDestroy);
  if ($$props.parent === void 0 && $$bindings.parent && parent !== void 0) $$bindings.parent(parent);
  parent = $parentStore;
  {
    objectStore.set(object);
  }
  $$unsubscribe_parentStore();
  return `   ${slots.default ? slots.default({}) : ``}`;
});
const SceneGraphObject = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { object } = $$props;
  if ($$props.object === void 0 && $$bindings.object && object !== void 0) $$bindings.object(object);
  return `${validate_component(HierarchicalObject, "HierarchicalObject").$$render(
    $$result,
    {
      object,
      onChildMount: (child) => object.add(child),
      onChildDestroy: (child) => object.remove(child)
    },
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
REVISION.replace("dev", "");
const useThrelteInternal = () => {
  return getContext("threlte-internal-context");
};
const contextName = "threlte-disposable-object-context";
const DisposableObject = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $mergedDispose, $$unsubscribe_mergedDispose;
  let $parentDispose, $$unsubscribe_parentDispose;
  const { collectDisposableObjects, addDisposableObjects, removeDisposableObjects } = useThrelteInternal();
  let { object = void 0 } = $$props;
  let previousObject = object;
  let { dispose = void 0 } = $$props;
  const parentDispose = getContext(contextName);
  $$unsubscribe_parentDispose = subscribe(parentDispose, (value) => $parentDispose = value);
  const mergedDispose = writable(dispose ?? $parentDispose ?? true);
  $$unsubscribe_mergedDispose = subscribe(mergedDispose, (value) => $mergedDispose = value);
  setContext(contextName, mergedDispose);
  let disposables = $mergedDispose ? collectDisposableObjects(object) : [];
  addDisposableObjects(disposables);
  onDestroy(() => {
    removeDisposableObjects(disposables);
  });
  if ($$props.object === void 0 && $$bindings.object && object !== void 0) $$bindings.object(object);
  if ($$props.dispose === void 0 && $$bindings.dispose && dispose !== void 0) $$bindings.dispose(dispose);
  {
    mergedDispose.set(dispose ?? $parentDispose ?? true);
  }
  {
    {
      if (object !== previousObject) {
        removeDisposableObjects(disposables);
        disposables = $mergedDispose ? collectDisposableObjects(object) : [];
        addDisposableObjects(disposables);
        previousObject = object;
      }
    }
  }
  $$unsubscribe_mergedDispose();
  $$unsubscribe_parentDispose();
  return `${slots.default ? slots.default({}) : ``}`;
});
const classRegex = /^\s*class\s+/;
const isClass = (input) => {
  if (typeof input !== "function") {
    return false;
  }
  return classRegex.test(input.toString());
};
const argsIsConstructorParameters = (args) => {
  return Array.isArray(args);
};
const determineRef = (is, args) => {
  if (isClass(is)) {
    if (argsIsConstructorParameters(args)) {
      return new is(...args);
    } else {
      return new is();
    }
  }
  return is;
};
const extendsObject3D = (object) => {
  return "isObject3D" in object;
};
const isDisposableObject = (object) => {
  return "dispose" in object;
};
const resolvePropertyPath = (target, propertyPath) => {
  if (propertyPath.includes(".")) {
    const path = propertyPath.split(".");
    const key2 = path.pop();
    for (let i = 0; i < path.length; i += 1) {
      target = target[path[i]];
    }
    return {
      target,
      key: key2
    };
  } else {
    return {
      target,
      key: propertyPath
    };
  }
};
const initialValueBeforeAttach = Symbol("initialValueBeforeAttach");
const useAttach = () => {
  const { invalidate } = useThrelte();
  let isAttached = false;
  let valueBeforeAttach = initialValueBeforeAttach;
  let detachFn;
  let attachedTo;
  let attachedKey;
  const update = (instance, parent, attach) => {
    detach();
    if (!attach) {
      const i = instance;
      const isMaterial = i?.isMaterial || false;
      if (isMaterial) {
        attach = "material";
      }
      const isGeometry = i?.isBufferGeometry || i?.isGeometry || false;
      if (isGeometry) {
        attach = "geometry";
      }
    }
    if (!attach)
      return;
    if (typeof attach === "function") {
      detachFn = attach(parent, instance);
    } else {
      const { target, key: key2 } = resolvePropertyPath(parent, attach);
      valueBeforeAttach = target[key2];
      target[key2] = instance;
      attachedTo = target;
      attachedKey = key2;
    }
    isAttached = true;
    invalidate();
  };
  const detach = () => {
    if (!isAttached)
      return;
    if (detachFn) {
      detachFn();
      detachFn = void 0;
    } else if (attachedTo && attachedKey && valueBeforeAttach !== initialValueBeforeAttach) {
      attachedTo[attachedKey] = valueBeforeAttach;
      valueBeforeAttach = initialValueBeforeAttach;
      attachedTo = void 0;
      attachedKey = void 0;
    }
    isAttached = false;
    invalidate();
  };
  onDestroy(() => {
    detach();
  });
  return {
    update
  };
};
const isCamera = (value) => {
  return value && value.isCamera;
};
const isOrthographicCamera = (value) => {
  return value && value.isOrthographicCamera;
};
const isPerspectiveCamera = (value) => {
  return value && value.isPerspectiveCamera;
};
const isPerspectiveCameraOrOrthographicCamera = (value) => {
  return isPerspectiveCamera(value) || isOrthographicCamera(value);
};
const useCamera = () => {
  const { invalidate, size, camera } = useThrelte();
  let currentInstance;
  let unsubscribe = void 0;
  onDestroy(() => {
    unsubscribe?.();
  });
  const subscriber = (size2) => {
    if (!currentInstance)
      return;
    if (isOrthographicCamera(currentInstance)) {
      currentInstance.left = size2.width / -2;
      currentInstance.right = size2.width / 2;
      currentInstance.top = size2.height / 2;
      currentInstance.bottom = size2.height / -2;
      currentInstance.updateProjectionMatrix();
      currentInstance.updateMatrixWorld();
      invalidate();
    } else if (isPerspectiveCamera(currentInstance)) {
      currentInstance.aspect = size2.width / size2.height;
      currentInstance.updateProjectionMatrix();
      currentInstance.updateMatrixWorld();
      invalidate();
    }
  };
  const update = (instance, manual) => {
    unsubscribe?.();
    if (manual || !isPerspectiveCameraOrOrthographicCamera(instance)) {
      currentInstance = void 0;
      return;
    }
    currentInstance = instance;
    unsubscribe = size.subscribe(subscriber);
  };
  const makeDefaultCamera = (instance, makeDefault) => {
    if (!isCamera(instance) || !makeDefault)
      return;
    camera.set(instance);
    invalidate();
  };
  return {
    update,
    makeDefaultCamera
  };
};
const createRawEventDispatcher = () => {
  const component = get_current_component();
  const dispatchRawEvent = (type, value) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      callbacks.forEach((fn) => {
        fn(value);
      });
    }
  };
  const hasEventListener = (type) => {
    return Boolean(component.$$.callbacks[type]);
  };
  Object.defineProperty(dispatchRawEvent, "hasEventListener", {
    value: hasEventListener,
    enumerable: true
  });
  return dispatchRawEvent;
};
const useCreateEvent = () => {
  createRawEventDispatcher();
  const cleanupFunctions = [];
  const updateRef = (newRef) => {
    return;
  };
  onDestroy(() => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  });
  return {
    updateRef
  };
};
const isEventDispatcher = (value) => {
  return !!value?.addEventListener;
};
const useEvents = () => {
  const dispatch = createRawEventDispatcher();
  get_current_component();
  const eventHandlerProxy = (event) => {
    if (event?.type) {
      dispatch(event.type, event);
    }
  };
  const cleanupEventListeners = (ref2, events) => {
    if (isEventDispatcher(ref2)) {
      events.forEach((eventName) => {
        ref2.removeEventListener(eventName, eventHandlerProxy);
      });
    }
  };
  const addEventListeners = (ref2, events) => {
    if (isEventDispatcher(ref2)) {
      events.forEach((eventName) => {
        ref2.addEventListener(eventName, eventHandlerProxy);
      });
    }
  };
  const ref = writable();
  const eventNames = writable([]);
  watch([ref, eventNames], ([$ref, $eventNames]) => {
    addEventListeners($ref, $eventNames);
    return () => cleanupEventListeners($ref, $eventNames);
  });
  const updateRef = (newRef) => {
    ref.set(newRef);
  };
  return {
    updateRef
  };
};
const usePlugins = (params) => {
  const pluginContextName = "threlte-plugin-context";
  const plugins = getContext(pluginContextName);
  if (!plugins)
    return;
  const pluginsReturns = Object.values(plugins).map((plugin) => plugin(params)).filter(Boolean);
  const pluginsProps = pluginsReturns.flatMap((callback) => callback.pluginProps ?? []);
  let refCleanupCallbacks = [];
  onDestroy(() => {
    refCleanupCallbacks.forEach((callback) => callback());
  });
  const updateRef = (ref) => {
    refCleanupCallbacks.forEach((callback) => callback());
    refCleanupCallbacks = [];
    pluginsReturns.forEach((callback) => {
      const cleanupCallback = callback.onRefChange?.(ref);
      if (cleanupCallback) {
        refCleanupCallbacks.push(cleanupCallback);
      }
    });
  };
  const updateProps = (props) => {
    pluginsReturns.forEach((callback) => {
      callback.onPropsChange?.(props);
    });
  };
  const updateRestProps = (restProps) => {
    pluginsReturns.forEach((callback) => {
      callback.onRestPropsChange?.(restProps);
    });
  };
  return {
    updateRef,
    updateProps,
    updateRestProps,
    pluginsProps
  };
};
const ignoredProps = /* @__PURE__ */ new Set(["$$scope", "$$slots", "type", "args", "attach", "instance"]);
const updateProjectionMatrixKeys = /* @__PURE__ */ new Set([
  "fov",
  "aspect",
  "near",
  "far",
  "left",
  "right",
  "top",
  "bottom",
  "zoom"
]);
const memoizeProp = (value) => {
  if (typeof value === "string")
    return true;
  if (typeof value === "number")
    return true;
  if (typeof value === "boolean")
    return true;
  if (typeof value === "undefined")
    return true;
  if (value === null)
    return true;
  return false;
};
const createSetter = (target, key2, value) => {
  if (!Array.isArray(value) && typeof value === "number" && typeof target[key2]?.setScalar === "function" && // colors do have a setScalar function, but we don't want to use it, because
  // the hex notation (i.e. 0xff0000) is very popular and matches the number
  // type. So we exclude colors here.
  !target[key2]?.isColor) {
    return (target2, key3, value2) => {
      target2[key3].setScalar(value2);
    };
  } else {
    if (typeof target[key2]?.set === "function") {
      if (Array.isArray(value)) {
        return (target2, key3, value2) => {
          target2[key3].set(...value2);
        };
      } else {
        return (target2, key3, value2) => {
          target2[key3].set(value2);
        };
      }
    } else {
      return (target2, key3, value2) => {
        target2[key3] = value2;
      };
    }
  }
};
const useProps = () => {
  const { invalidate } = useThrelte();
  const memoizedProps = /* @__PURE__ */ new Map();
  const memoizedSetters = /* @__PURE__ */ new Map();
  const setProp = (instance, propertyPath, value, options) => {
    if (memoizeProp(value)) {
      const memoizedProp = memoizedProps.get(propertyPath);
      if (memoizedProp && memoizedProp.instance === instance && memoizedProp.value === value) {
        return;
      }
      memoizedProps.set(propertyPath, {
        instance,
        value
      });
    }
    const { key: key2, target } = resolvePropertyPath(instance, propertyPath);
    if (value !== void 0 && value !== null) {
      const memoizedSetter = memoizedSetters.get(propertyPath);
      if (memoizedSetter) {
        memoizedSetter(target, key2, value);
      } else {
        const setter = createSetter(target, key2, value);
        memoizedSetters.set(propertyPath, setter);
        setter(target, key2, value);
      }
    } else {
      createSetter(target, key2, value)(target, key2, value);
    }
    if (options.manualCamera)
      return;
    if (updateProjectionMatrixKeys.has(key2) && (target.isPerspectiveCamera || target.isOrthographicCamera)) {
      target.updateProjectionMatrix();
    }
  };
  const updateProps = (instance, props, options) => {
    for (const key2 in props) {
      if (!ignoredProps.has(key2) && !options.pluginsProps?.includes(key2)) {
        setProp(instance, key2, props[key2], options);
      }
      invalidate();
    }
  };
  return {
    updateProps
  };
};
const T = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["is", "args", "attach", "manual", "makeDefault", "dispose", "ref"]);
  let $parent, $$unsubscribe_parent;
  let { is } = $$props;
  let { args = void 0 } = $$props;
  let { attach = void 0 } = $$props;
  let { manual = void 0 } = $$props;
  let { makeDefault = void 0 } = $$props;
  let { dispose = void 0 } = $$props;
  const parent = useParent();
  $$unsubscribe_parent = subscribe(parent, (value) => $parent = value);
  const createEvent = useCreateEvent();
  let ref = determineRef(is, args);
  createEvent.updateRef(ref);
  let initialized = false;
  const maybeSetRef = () => {
    if (!initialized) {
      initialized = true;
      return;
    }
    ref = determineRef(is, args);
    createEvent.updateRef(ref);
  };
  let { ref: publicRef = ref } = $$props;
  const parentContext = createParentContext(ref);
  const plugins = usePlugins({ ref, props: $$props });
  const pluginsProps = plugins?.pluginsProps ?? [];
  const props = useProps();
  const camera = useCamera();
  const attachment = useAttach();
  const events = useEvents();
  if ($$props.is === void 0 && $$bindings.is && is !== void 0) $$bindings.is(is);
  if ($$props.args === void 0 && $$bindings.args && args !== void 0) $$bindings.args(args);
  if ($$props.attach === void 0 && $$bindings.attach && attach !== void 0) $$bindings.attach(attach);
  if ($$props.manual === void 0 && $$bindings.manual && manual !== void 0) $$bindings.manual(manual);
  if ($$props.makeDefault === void 0 && $$bindings.makeDefault && makeDefault !== void 0) $$bindings.makeDefault(makeDefault);
  if ($$props.dispose === void 0 && $$bindings.dispose && dispose !== void 0) $$bindings.dispose(dispose);
  if ($$props.ref === void 0 && $$bindings.ref && publicRef !== void 0) $$bindings.ref(publicRef);
  {
    maybeSetRef();
  }
  publicRef = ref;
  {
    parentContext.set(ref);
  }
  {
    props.updateProps(ref, $$restProps, { manualCamera: manual, pluginsProps });
  }
  {
    camera.update(ref, manual);
  }
  {
    camera.makeDefaultCamera(ref, makeDefault);
  }
  {
    attachment.update(ref, $parent, attach);
  }
  {
    events.updateRef(ref);
  }
  {
    plugins?.updateRef(ref);
  }
  {
    plugins?.updateProps($$props);
  }
  {
    plugins?.updateRestProps($$restProps);
  }
  $$unsubscribe_parent();
  return `${isDisposableObject(ref) ? `${validate_component(DisposableObject, "DisposableObject").$$render($$result, { object: ref, dispose }, {}, {})}` : ``} ${extendsObject3D(ref) ? `${validate_component(SceneGraphObject, "SceneGraphObject").$$render($$result, { object: ref }, {}, {
    default: () => {
      return `${slots.default ? slots.default({ ref }) : ``}`;
    }
  })}` : `${slots.default ? slots.default({ ref }) : ``}`}`;
});
const catalogue = {};
const augmentConstructorArgs = (args, is) => {
  const module = catalogue[is] || THREE[is];
  if (!module) {
    throw new Error(`No Three.js module found for ${is}. Did you forget to extend the catalogue?`);
  }
  return {
    ...args,
    props: {
      ...args.props,
      is: module
    }
  };
};
const proxyTConstructor = (is) => {
  return new Proxy(class {
  }, {
    construct(_, [args]) {
      const castedArgs = args;
      return new T(augmentConstructorArgs(castedArgs, is));
    }
  });
};
new Proxy(class {
}, {
  construct(_, [args]) {
    const castedArgs = args;
    return new T(castedArgs);
  },
  get(_, is) {
    return proxyTConstructor(is);
  }
});
new Vector3();
new Vector3();
new Vector3();
Number.parseInt(REVISION.replace("dev", ""));
new Matrix4();
new Matrix4();
new Mesh();
`
	  #include <common>
    ${ShaderChunk.logdepthbuf_pars_vertex}
    ${ShaderChunk.fog_pars_vertex}

    attribute vec3 previous;
    attribute vec3 next;
    attribute float side;
    attribute float width;
    attribute float counters;

    uniform vec2 resolution;
    uniform float lineWidth;
    uniform vec3 color;
    uniform float opacity;
    uniform float sizeAttenuation;
    uniform float scaleDown;

    varying vec2 vUV;
    varying vec4 vColor;
    varying float vCounters;

    vec2 intoScreen(vec4 i) {
        return resolution * (0.5 * i.xy / i.w + 0.5);
    }

    void main() {
        float aspect = resolution.y / resolution.x;

        mat4 m = projectionMatrix * modelViewMatrix;

        vec4 currentClip = m * vec4( position, 1.0 );
        vec4 prevClip = m * vec4( previous, 1.0 );
        vec4 nextClip = m * vec4( next, 1.0 );

        vec4 currentNormed = currentClip / currentClip.w;
        vec4 prevNormed = prevClip / prevClip.w;
        vec4 nextNormed = nextClip / nextClip.w;

        vec2 currentScreen = intoScreen(currentNormed);
        vec2 prevScreen = intoScreen(prevNormed);
        vec2 nextScreen = intoScreen(nextNormed);

        float actualWidth = lineWidth * width;

        vec2 dir;
        if(nextScreen == currentScreen) {
            dir = normalize( currentScreen - prevScreen );
        } else if(prevScreen == currentScreen) {
            dir = normalize( nextScreen - currentScreen );
        } else {
            vec2 inDir = currentScreen - prevScreen;
            vec2 outDir = nextScreen - currentScreen;
            vec2 fullDir = nextScreen - prevScreen;

            if(length(fullDir) > 0.0) {
                dir = normalize(fullDir);
            } else if(length(inDir) > 0.0){
                dir = normalize(inDir);
            } else {
                dir = normalize(outDir);
            }
        }

        vec2 normal = vec2(-dir.y, dir.x);

        if(sizeAttenuation != 0.0) {
            normal /= currentClip.w;
            normal *= min(resolution.x, resolution.y);
        }

        if (scaleDown > 0.0) {
            float dist = length(nextNormed - prevNormed);
            normal *= smoothstep(0.0, scaleDown, dist);
        }

        vec2 offsetInScreen = actualWidth * normal * side * 0.5;

        vec2 withOffsetScreen = currentScreen + offsetInScreen;
        vec3 withOffsetNormed = vec3((2.0 * withOffsetScreen/resolution - 1.0), currentNormed.z);

        vCounters = counters;
        vColor = vec4( color, opacity );
        vUV = uv;

        gl_Position = currentClip.w * vec4(withOffsetNormed, 1.0);

        ${ShaderChunk.logdepthbuf_vertex}
        ${ShaderChunk.fog_vertex}
    }
`;
`
uniform vec3 glowColor;
uniform float falloffAmount;
uniform float glowSharpness;
uniform float glowInternalRadius;

varying vec3 vPosition;
varying vec3 vNormal;

void main()
{
	// Normal
	vec3 normal = normalize(vNormal);
	if(!gl_FrontFacing)
			normal *= - 1.0;
	vec3 viewDirection = normalize(cameraPosition - vPosition);
	float fresnel = dot(viewDirection, normal);
	fresnel = pow(fresnel, glowInternalRadius + 0.1);
	float falloff = smoothstep(0., falloffAmount, fresnel);
	float fakeGlow = fresnel;
	fakeGlow += fresnel * glowSharpness;
	fakeGlow *= falloff;
	gl_FragColor = vec4(clamp(glowColor * fresnel, 0., 1.0), clamp(fakeGlow, 0., 1.0));

	${ShaderChunk.tonemapping_fragment}
	${ShaderChunk.colorspace_fragment}
}`;
`
uniform sampler2D pointTexture;
uniform float fade;
uniform float opacity;

varying vec3 vColor;
void main() {
	float pointOpacity = 1.0;
	if (fade == 1.0) {
		float d = distance(gl_PointCoord, vec2(0.5, 0.5));
		pointOpacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
	}
	gl_FragColor = vec4(vColor, pointOpacity * opacity);

	${ShaderChunk.tonemapping_fragment}
	${ShaderChunk.colorspace_fragment}
}`;
`#define ENVMAP_TYPE_CUBE_UV
precision highp isampler2D;
precision highp usampler2D;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying mat4 vModelMatrixInverse;

#ifdef USE_INSTANCING_COLOR
	varying vec3 vInstanceColor;
#endif

#ifdef ENVMAP_TYPE_CUBEM
	uniform samplerCube envMap;
#else
	uniform sampler2D envMap;
#endif

uniform float bounces;
${shaderStructs}
${shaderIntersectFunction}
uniform BVH bvh;
uniform float ior;
uniform bool correctMips;
uniform vec2 resolution;
uniform float fresnel;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;
uniform float aberrationStrength;
uniform vec3 color;

float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
	return pow( 1.0 + dot( viewDirection, worldNormal), 10.0 );
}

vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 normal, float ior, mat4 modelMatrixInverse) {
	vec3 rayOrigin = ro;
	vec3 rayDirection = rd;
	rayDirection = refract(rayDirection, normal, 1.0 / ior);
	rayOrigin = vWorldPosition + rayDirection * 0.001;
	rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;
	rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
	for(float i = 0.0; i < bounces; i++) {
		uvec4 faceIndices = uvec4( 0u );
		vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
		vec3 barycoord = vec3( 0.0 );
		float side = 1.0;
		float dist = 0.0;
		bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
		vec3 hitPos = rayOrigin + rayDirection * max(dist - 0.001, 0.0);
		vec3 tempDir = refract(rayDirection, faceNormal, ior);
		if (length(tempDir) != 0.0) {
			rayDirection = tempDir;
			break;
		}
		rayDirection = reflect(rayDirection, faceNormal);
		rayOrigin = hitPos + rayDirection * 0.01;
	}
	rayDirection = normalize((modelMatrix * vec4(rayDirection, 0.0)).xyz);
	return rayDirection;
}

#include <common>
#include <cube_uv_reflection_fragment>

#ifdef ENVMAP_TYPE_CUBEM
	vec4 textureGradient(samplerCube envMap, vec3 rayDirection, vec3 directionCamPerfect) {
		return textureGrad(envMap, rayDirection, dFdx(correctMips ? directionCamPerfect: rayDirection), dFdy(correctMips ? directionCamPerfect: rayDirection));
	}
#else
	vec4 textureGradient(sampler2D envMap, vec3 rayDirection, vec3 directionCamPerfect) {
		vec2 uvv = equirectUv( rayDirection );
		vec2 smoothUv = equirectUv( directionCamPerfect );
		return textureGrad(envMap, uvv, dFdx(correctMips ? smoothUv : uvv), dFdy(correctMips ? smoothUv : uvv));
	}
#endif

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec3 directionCamPerfect = (projectionMatrixInverse * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
	directionCamPerfect = (viewMatrixInverse * vec4(directionCamPerfect, 0.0)).xyz;
	directionCamPerfect = normalize(directionCamPerfect);
	vec3 normal = vNormal;
	vec3 rayOrigin = cameraPosition;
	vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
	vec3 finalColor;
	#ifdef CHROMATIC_ABERRATIONS
		vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
		#ifdef FAST_CHROMA
			vec3 rayDirectionR = normalize(rayDirectionG + 1.0 * vec3(aberrationStrength / 2.0));
			vec3 rayDirectionB = normalize(rayDirectionG - 1.0 * vec3(aberrationStrength / 2.0));
		#else
			vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 - aberrationStrength), 1.0), vModelMatrixInverse);
			vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 + aberrationStrength), 1.0), vModelMatrixInverse);
		#endif
		float finalColorR = textureGradient(envMap, rayDirectionR, directionCamPerfect).r;
		float finalColorG = textureGradient(envMap, rayDirectionG, directionCamPerfect).g;
		float finalColorB = textureGradient(envMap, rayDirectionB, directionCamPerfect).b;
		finalColor = vec3(finalColorR, finalColorG, finalColorB);
	#else
		rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
		finalColor = textureGradient(envMap, rayDirection, directionCamPerfect).rgb;
	#endif

	finalColor *= color;
	#ifdef USE_INSTANCING_COLOR
		finalColor *= vInstanceColor;
	#endif

	vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
	float nFresnel = fresnelFunc(viewDirection, normal) * fresnel;
	gl_FragColor = vec4(mix(finalColor, vec3(1.0), nFresnel), 1.0);
	${ShaderChunk.tonemapping_fragment}
	${ShaderChunk.colorspace_fragment}
}`;
function getSupabaseStorageUrl(path) {
  if (!path) return null;
  return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/rendered-id-cards/${path}`;
}
function getCardId(card) {
  const id = card.idcard_id?.toString();
  if (!id) return "";
  return id;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let templateFields;
  let groupedCards;
  let { data } = $$props;
  const [headerRow, ...allRows] = data.idCards;
  const header = headerRow;
  let searchQuery = "";
  let dataRows = [];
  let downloadingCards = /* @__PURE__ */ new Set();
  let deletingCards = /* @__PURE__ */ new Set();
  let selectedCards = /* @__PURE__ */ new Set();
  let selectedCount = 0;
  let groupSelectionStates = /* @__PURE__ */ new Map();
  let isSelected = (cardId) => selectedCards.has(cardId);
  let isGroupSelected = (cards) => {
    return cards.every((card) => {
      const cardId = getCardId(card);
      return cardId && selectedCards.has(cardId);
    });
  };
  const selectionManager = {
    isSelected,
    isGroupSelected,
    toggleSelection: (cardId) => {
      if (!cardId) return;
      const newSelectedCards = new Set(selectedCards);
      if (newSelectedCards.has(cardId)) {
        newSelectedCards.delete(cardId);
      } else {
        newSelectedCards.add(cardId);
      }
      selectedCards = newSelectedCards;
    },
    toggleGroupSelection: (cards) => {
      const validCards = cards.filter((card) => {
        const cardId = getCardId(card);
        return !!cardId;
      });
      const allSelected = validCards.every((card) => selectedCards.has(getCardId(card)));
      const newSelectedCards = new Set(selectedCards);
      validCards.forEach((card) => {
        const cardId = getCardId(card);
        if (allSelected) {
          newSelectedCards.delete(cardId);
        } else {
          newSelectedCards.add(cardId);
        }
      });
      selectedCards = newSelectedCards;
    },
    getSelectedCount: () => selectedCards.size,
    clearSelection: () => {
      selectedCards = /* @__PURE__ */ new Set();
      selectedCount = 0;
    }
  };
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  templateFields = header?.metadata?.templates || {};
  {
    {
      const query = searchQuery.toLowerCase();
      dataRows = allRows.filter((row) => {
        if (row.is_header) return false;
        if (row.template_name.toLowerCase().includes(query)) return true;
        return Object.values(row.fields || {}).some((field) => field.value.toLowerCase().includes(query));
      });
    }
  }
  groupedCards = (() => {
    const groups = {};
    dataRows.forEach((card) => {
      if (!groups[card.template_name]) {
        groups[card.template_name] = [];
      }
      groups[card.template_name].push(card);
    });
    return groups;
  })();
  {
    {
      Object.entries(groupedCards).forEach(([templateName, cards]) => {
        groupSelectionStates.set(templateName, cards.every((card) => selectedCards.has(getCardId(card))));
      });
      groupSelectionStates = groupSelectionStates;
      selectedCount = selectedCards.size;
    }
  }
  return `<div class="mb-4 flex justify-between items-center"><input type="text" placeholder="Search..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"${add_attribute("value", searchQuery, 0)}> ${selectedCount > 0 ? `<div class="ml-4 flex gap-2"><button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Download Selected (${escape(selectedCount)})</button> <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Delete Selected (${escape(selectedCount)})</button></div>` : ``}</div> ${each(Object.entries(groupedCards), ([templateName, cards]) => {
    return `<div class="mb-8"><h3 class="text-xl font-semibold mb-4">${escape(templateName)}</h3> <div class="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20"><tr><th scope="col" class="sticky left-0 z-30 w-16 px-4 py-2 bg-gray-50 dark:bg-gray-800"><div class="flex items-center justify-center"><input type="checkbox" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" ${groupSelectionStates.get(templateName) ? "checked" : ""}> </div></th> <th scope="col" class="sticky left-[57px] z-30 px-4 py-2 bg-gray-50 dark:bg-gray-800" data-svelte-h="svelte-1trahj3"><span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</span></th> ${templateFields[templateName] ? `${each(templateFields[templateName] || [], (field) => {
      return `<th scope="col" class="${"px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 " + escape(
        field.side === "front" ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-green-50/50 dark:bg-green-900/10",
        true
      )}"><span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${escape(field.variableName)}</span> </th>`;
    })}` : ``} <th scope="col" class="sticky right-0 z-30 px-4 py-2 bg-gray-50 dark:bg-gray-800" data-svelte-h="svelte-5ow825"><span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span></th> </tr></thead> <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">${each(cards, (card) => {
      return `<tr class="group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><td class="sticky left-0 z-20 w-16 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"><div class="flex items-center justify-center"><input type="checkbox" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" ${selectionManager.isSelected(getCardId(card)) ? "checked" : ""}> </div></td> <td class="sticky left-[57px] z-20 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"><div class="flex items-center space-x-2">${card.front_image ? `<img${add_attribute("src", getSupabaseStorageUrl(card.front_image), 0)} alt="Front Preview" class="w-8 h-8 object-cover rounded">` : ``} </div></td> ${templateFields[templateName] ? `${each(templateFields[templateName] || [], (field) => {
        return `<td class="${"px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 " + escape(
          field.side === "front" ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-green-50/50 dark:bg-green-900/10",
          true
        )}">${escape(card.fields?.[field.variableName]?.value || "")} </td>`;
      })}` : ``} <td class="sticky right-0 z-20 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 flex gap-2 items-center"><button class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150" ${downloadingCards.has(getCardId(card)) ? "disabled" : ""}>${escape(downloadingCards.has(getCardId(card)) ? "Downloading..." : "Download")}</button> <button class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-150" ${deletingCards.has(getCardId(card)) ? "disabled" : ""}>${escape(deletingCards.has(getCardId(card)) ? "Deleting..." : "Delete")} </button></td> </tr>`;
    })}</tbody> </table></div> </div>`;
  })} ${``}`;
});
export {
  Page as default
};
