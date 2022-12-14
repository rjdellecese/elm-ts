---
title: Sub.ts
nav_order: 15
parent: Modules
---

## Sub overview

Defines `Sub`s as streams of messages.

Added in v0.5.0

---

<h2 class="text-delta">Table of contents</h2>

- [Functor](#functor)
  - [map](#map)
- [constructors](#constructors)
  - [none](#none)
- [model](#model)
  - [Sub (type alias)](#sub-type-alias)
- [utils](#utils)
  - [batch](#batch)

---

# Functor

## map

Maps `Msg` of a `Sub` into another `Msg`.

**Signature**

```ts
export declare function map<A, Msg>(f: (a: A) => Msg): (sub: Sub<A>) => Sub<Msg>
```

Added in v0.5.0

# constructors

## none

A `none` subscription is an empty stream.

**Signature**

```ts
export declare const none: any
```

Added in v0.5.0

# model

## Sub (type alias)

**Signature**

```ts
export type Sub<Msg> = Observable<Msg>
```

Added in v0.5.0

# utils

## batch

Merges subscriptions streams into one stream.

**Signature**

```ts
export declare function batch<Msg>(arr: Array<Sub<Msg>>): Sub<Msg>
```

Added in v0.5.0
