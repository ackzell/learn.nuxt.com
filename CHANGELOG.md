# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.3.0](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.5...v0.3.0) (2026-09-12)


### Features

* add first challenge validation support ([129fed0](https://github.com/ackzell/amoxtli-vue-2/commit/129fed0fa8a8c798eb649717d321825ce61a43a3))
* **challenge:** centralized challenge banking with localized suites ([06f0056](https://github.com/ackzell/amoxtli-vue-2/commit/06f00568cc7120e1e03a735e39a51370247a85eb))
* **challenge:** retake flow, non-destructive solution peek, persist passing files ([a3c0f6b](https://github.com/ackzell/amoxtli-vue-2/commit/a3c0f6b103562aef2026f74a809da951009e5825))
* **cli:** quiz and challenge authoring wizards with letter-suffix lessons ([5c85f7d](https://github.com/ackzell/amoxtli-vue-2/commit/5c85f7d02a1dd40800523eefb3c5022b06daf24e))
* **content:** realign es_mx chapters with en 05-07 (interactivity, reactivity, styling) ([f0720ad](https://github.com/ackzell/amoxtli-vue-2/commit/f0720ad08e5a48673c3cae6b4aa126ede9efccaf))
* per-pattern cycling colors and per-annotation hover for code highlights ([992073d](https://github.com/ackzell/amoxtli-vue-2/commit/992073dc1cf1bdef369de901d7535dc747cdf5e4))
* **quiz:** add interactive quiz blocks with grading and progress tracking ([defa472](https://github.com/ackzell/amoxtli-vue-2/commit/defa472f1e59a9cfadcd9e80148a69928c1c1a97))


### Bug Fixes

* **preview:** apply challenge + dark params once iframe is available ([ed2c1be](https://github.com/ackzell/amoxtli-vue-2/commit/ed2c1be3dab306b480c3b3abdaf5f31c6fb164b7))
* **templates:** lazy-load challenge harness and pre-bundle vitest deps to fix vue hmr ([a3e692c](https://github.com/ackzell/amoxtli-vue-2/commit/a3e692c2372ddbe3e38f54a731e8300196f9534b))
* **tooltip:** force persisted twoslash tooltips below their trigger ([ffe2868](https://github.com/ackzell/amoxtli-vue-2/commit/ffe28682c83d3ce8536305e6914d9a1e7ccd3c41))
* **ui:** switching between docs and code view made a jarring transition ([c309693](https://github.com/ackzell/amoxtli-vue-2/commit/c309693a0eb90ec70cf461339cbc834fe1e3e214))
* **ui:** updating the challenge styles, re-ordering the elements in the verification ([45f733a](https://github.com/ackzell/amoxtli-vue-2/commit/45f733ad5b2415f2b55a9db303863a15719f94df))

## [0.2.5](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.4...v0.2.5) (2026-08-21)

## [0.2.4](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.3...v0.2.4) (2026-08-21)


### Bug Fixes

* share MonacoEnvironment installer between playground and VueLive ([9862654](https://github.com/ackzell/amoxtli-vue-2/commit/9862654f163f399e40e4a205524ce5e2b0ce34f4))

## [0.2.3](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.2...v0.2.3) (2026-08-21)


### Bug Fixes

* **almostnode:** fixing logs, terminal interaction and build not honoring docs only lessons ([2521245](https://github.com/ackzell/amoxtli-vue-2/commit/2521245fe4b86fec7266242a574a083574fef88d))
* replace import.meta.glob with virtual module for guide-meta-map ([f84ca24](https://github.com/ackzell/amoxtli-vue-2/commit/f84ca24a6b1329c9fd49de0777b726b80cb9d643))

## [0.2.2](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.1...v0.2.2) (2026-08-19)

## [0.2.1](https://github.com/ackzell/amoxtli-vue-2/compare/v0.2.0...v0.2.1) (2026-08-19)

## [0.2.0](https://github.com/ackzell/amoxtli-vue-2/compare/v0.1.8...v0.2.0) (2026-08-19)


### Features

* **chapter-nextTick:** introducing twoslash at the beginning of the lesson ([bd2f031](https://github.com/ackzell/amoxtli-vue-2/commit/bd2f031112536008694b0ee95b04b58e76b88f33))
* **content:** creating content for computed properties ([c1ca138](https://github.com/ackzell/amoxtli-vue-2/commit/c1ca13896ba90f62d5a66f6734da4a2722052bf2))
* **helper-components:** VueLive: updating it to accept an "extracts" attribute ([26ba78a](https://github.com/ackzell/amoxtli-vue-2/commit/26ba78aead3b96343edebc48db6962197c26b64d))
* initial swap from webcontainers to almostnode ([f2c0358](https://github.com/ackzell/amoxtli-vue-2/commit/f2c03580c83922c036815a579b1e173f6488abc4))


### Bug Fixes

* resolve birpc timeout on onColorModeChange ([c3ada84](https://github.com/ackzell/amoxtli-vue-2/commit/c3ada8421e2686e2eb32d6038d4940eb706ffe0e))

## [0.1.8](https://github.com/ackzell/amoxtli-vue-2/compare/v0.1.7...v0.1.8) (2026-06-28)


### Features

* **chapter-styling:** starting to add content for the chapter ([bccc17c](https://github.com/ackzell/amoxtli-vue-2/commit/bccc17c6d2f05dd2b720b11cd10d956611ac1a88))
* **create-content-CLI:** adding a new tool to create content via a CLI ([af0b53a](https://github.com/ackzell/amoxtli-vue-2/commit/af0b53a83f208d7ca990858a997959cda2317976))
* **helper-components:** updating the DirectivePartsDiagram component to highlight the legends better ([0efb4e7](https://github.com/ackzell/amoxtli-vue-2/commit/0efb4e761ebda939dd890d9e6f50bfc5232fa987))
* **styles:** navigation buttons  on the docs navigation should look like nav cards ([6f80937](https://github.com/ackzell/amoxtli-vue-2/commit/6f8093700adc826e9ec6fcf12cd3c8cba0a97892))


### Bug Fixes

* **styles:** fixing tooltip stacking display. It should no longer show on top of the navigation. ([4544c90](https://github.com/ackzell/amoxtli-vue-2/commit/4544c90703540d08e9926fa5d129626ddca7c5a9))
* **styles:** updating some styles for consistency ([ad0a16b](https://github.com/ackzell/amoxtli-vue-2/commit/ad0a16b001f227759ad5557ec753bf5fde4d5266))

## 0.1.7 (2026-06-13)


### Features

* "edit this page" button ([b323b4a](https://github.com/ackzell/amoxtli-vue-2/commit/b323b4a36fb24f4a618e6e4e95f510dc05c26f63))
* add a search button on the nav ([097e074](https://github.com/ackzell/amoxtli-vue-2/commit/097e074581dd57d97e1503c4e4d1926c539f5800))
* add basic i18n support, and port Japanese content from vuejs-jp/learn.nuxt.com  ([#217](https://github.com/ackzell/amoxtli-vue-2/issues/217)) ([5574fe0](https://github.com/ackzell/amoxtli-vue-2/commit/5574fe0539d0192652e13bcda2a81b604ec8a9e0))
* add birpc for communication ([3818f93](https://github.com/ackzell/amoxtli-vue-2/commit/3818f938ba1d6705f397f218c7577102959acc15)), closes [#39](https://github.com/ackzell/amoxtli-vue-2/issues/39)
* add caret to file tree ([b93de4b](https://github.com/ackzell/amoxtli-vue-2/commit/b93de4b2115616dace90c6c160d3307dde26443d))
* add console toggle button on deps installation ([b0a052d](https://github.com/ackzell/amoxtli-vue-2/commit/b0a052d565771469d79f6adc961cf8557075aa50))
* add download as zip button ([ed369cf](https://github.com/ackzell/amoxtli-vue-2/commit/ed369cf15faa2dba4a2357d8f5312c3ff6675a99))
* add floating-vue for information popup ([8ec5264](https://github.com/ackzell/amoxtli-vue-2/commit/8ec5264746bd033e82c77021a5604488493a79a8))
* add interactivity shell after user terminiate Nuxt server ([#65](https://github.com/ackzell/amoxtli-vue-2/issues/65)) ([c41b419](https://github.com/ackzell/amoxtli-vue-2/commit/c41b419db7dd6758c942162abb80e0f8eb6a94ca))
* add og-image ([393ff99](https://github.com/ackzell/amoxtli-vue-2/commit/393ff99cf35cee184fd1cf750c1b92bd93d28023))
* add scroll to bottom functionality to PanelTerminalClient ([#138](https://github.com/ackzell/amoxtli-vue-2/issues/138)) ([ab48ec1](https://github.com/ackzell/amoxtli-vue-2/commit/ab48ec143bf70c00d33295a3ab4a1e223404d5e1))
* add styles in /ja/09.workspace/01.todo-list ([#286](https://github.com/ackzell/amoxtli-vue-2/issues/286)) ([e7436f1](https://github.com/ackzell/amoxtli-vue-2/commit/e7436f14be2ba93351071802798c6d9d2a168c16))
* add tool bar for each tab ([18258f5](https://github.com/ackzell/amoxtli-vue-2/commit/18258f5208e952095445e707728f1ec7f1fd5d5c))
* add workspace todo-list ([#242](https://github.com/ackzell/amoxtli-vue-2/issues/242)) ([852474b](https://github.com/ackzell/amoxtli-vue-2/commit/852474bdcf9ab97fa94e6c5f5f269c5fb204e77d))
* adding feedback flow ([a46db03](https://github.com/ackzell/amoxtli-vue-2/commit/a46db035c2c88491a692c53b5a79e5bc46afc9e1))
* Adding twoslash support ([d6c4de0](https://github.com/ackzell/amoxtli-vue-2/commit/d6c4de0ab23ad5faaa47e3d23c16d991e0068a4c))
* algin fontFamily in Monaco Editor ([ee52564](https://github.com/ackzell/amoxtli-vue-2/commit/ee52564f97c878bc521799b7fb43c3df163effc5))
* align with nuxt.com design ([ebf7293](https://github.com/ackzell/amoxtli-vue-2/commit/ebf7293625c23ce57fc3918125f079ef4ebdb801))
* allow each guide to configure file filter ([#101](https://github.com/ackzell/amoxtli-vue-2/issues/101)) ([90908e7](https://github.com/ackzell/amoxtli-vue-2/commit/90908e701b78243a898badcf582fbeaf629544a5))
* allow guides to toggle features ([e44215a](https://github.com/ackzell/amoxtli-vue-2/commit/e44215ab6bafa0b0c1564b3ac970ed263a8146c9))
* also provide git sha for quick linking ([fda126b](https://github.com/ackzell/amoxtli-vue-2/commit/fda126b522776bcbac78ea3d879e1ab21343cb9b))
* automatically load template files ([a171afc](https://github.com/ackzell/amoxtli-vue-2/commit/a171afc77a43968c34eb60cc6bec83fd3e428939))
* basic layout ([95753c5](https://github.com/ackzell/amoxtli-vue-2/commit/95753c559964dea1f9f99a0ac0f118876918873b))
* basic navigation dropdown ([7c28b98](https://github.com/ackzell/amoxtli-vue-2/commit/7c28b9852aff2934681a5372ccd372166ffc7c93))
* basic search feature ([6df5f8a](https://github.com/ackzell/amoxtli-vue-2/commit/6df5f8afb6a6bbc2e7a5b0bf6457744c5003e646))
* basic show solutions feature ([9c90ef4](https://github.com/ackzell/amoxtli-vue-2/commit/9c90ef415046408610b76aee65aa698424c4d276))
* basic web container working ([868546a](https://github.com/ackzell/amoxtli-vue-2/commit/868546a4e0610dff846233f936197bdfb8dc134b))
* breadcrumbs ([b8a8ee7](https://github.com/ackzell/amoxtli-vue-2/commit/b8a8ee7ae95e68e6724389037646ff542c5c0685))
* button to restart server ([2e9c245](https://github.com/ackzell/amoxtli-vue-2/commit/2e9c245b8d5e04a5fd7682cfbf4adccb8f26f376))
* creating a new component to demonstrate the make up of a directive ([d91bd4a](https://github.com/ackzell/amoxtli-vue-2/commit/d91bd4ad2540e18a0ae6f3020d8174758dfd04c9))
* Disable saving with Ctrl/Cmd + S in Monaco Editor. ([#80](https://github.com/ackzell/amoxtli-vue-2/issues/80)) ([144bea8](https://github.com/ackzell/amoxtli-vue-2/commit/144bea89a4df3d2107faf3e10c79901e0b43c4bc))
* display playground Vue and Nuxt version ([d84896f](https://github.com/ackzell/amoxtli-vue-2/commit/d84896fa5c4892c63d959fbb52f629b71117a3c3))
* dragging file tree panel ([307b934](https://github.com/ackzell/amoxtli-vue-2/commit/307b9349a9a6471cfff25f606317bd24b89fa7f2))
* dynamic navItem opening based on route path ([#118](https://github.com/ackzell/amoxtli-vue-2/issues/118)) ([c7d443a](https://github.com/ackzell/amoxtli-vue-2/commit/c7d443a34da5f474f371d673a128eae81a9e03c4))
* editor file tree ([#57](https://github.com/ackzell/amoxtli-vue-2/issues/57)) ([2d8b525](https://github.com/ackzell/amoxtli-vue-2/commit/2d8b525c50a58458020b29385ab0aa9e3930cc6f))
* **editor:** filter out some files ([171486c](https://github.com/ackzell/amoxtli-vue-2/commit/171486c589f5c6b6a8cef1e2977a09a8cad1b9b1))
* enable sitemap ([408b045](https://github.com/ackzell/amoxtli-vue-2/commit/408b045aca9cad686069139bf4f6ebe40bb12ec2))
* extract playground utils to a layer ([5119dfb](https://github.com/ackzell/amoxtli-vue-2/commit/5119dfbe9bb8fac2b4ae7449ec64be1dbd305686))
* feature flag to hide the navigation input ([74383a4](https://github.com/ackzell/amoxtli-vue-2/commit/74383a4fb63211efcccc93c28f149323f765da3a))
* finally get volar working ([ba9f53a](https://github.com/ackzell/amoxtli-vue-2/commit/ba9f53ab6b489b74e3d172c416feeb80c0baae0b))
* hide `birpc` deps intro layer's package ([0f5f0fc](https://github.com/ackzell/amoxtli-vue-2/commit/0f5f0fc0193925f7c1b859657375bd77031ad5e1))
* hide Nuxt loading screen ([d32311a](https://github.com/ackzell/amoxtli-vue-2/commit/d32311acd11564bec78357efe1dd9fc52434e83d))
* implement a basic command palette ([6354c47](https://github.com/ackzell/amoxtli-vue-2/commit/6354c47821421c4f204a6a97f884cf56a83b4ec5))
* improve command palette ([a17a780](https://github.com/ackzell/amoxtli-vue-2/commit/a17a780667507ab735f4f04515bd8b7107eed09a))
* improve guide structure & template dynamic loading ([#86](https://github.com/ackzell/amoxtli-vue-2/issues/86)) ([59c3280](https://github.com/ackzell/amoxtli-vue-2/commit/59c32809852bca1950497638c3b6d1495d43764a))
* improve interactive terminal experience, close [#74](https://github.com/ackzell/amoxtli-vue-2/issues/74) ([6e50d0d](https://github.com/ackzell/amoxtli-vue-2/commit/6e50d0db4a1e29ad8bfe09495f534393dda48f86))
* improve panel handler style ([ae8dba6](https://github.com/ackzell/amoxtli-vue-2/commit/ae8dba6f42802baaedab1f972db76882c8a1dacc))
* improve terminal theme ([67a0fb5](https://github.com/ackzell/amoxtli-vue-2/commit/67a0fb5b5d70a9bb6d9d21ceab66aa724f492246))
* install gramars in place ([e9eb1ca](https://github.com/ackzell/amoxtli-vue-2/commit/e9eb1ca544d9c6b26ce273915a0a47af8fa89438))
* integerate `@nuxt/content` ([b3b54c6](https://github.com/ackzell/amoxtli-vue-2/commit/b3b54c67f270a9e31be04bc5d53babd812ac0b2c))
* integrate volar language server (roughly) ([fcee98b](https://github.com/ackzell/amoxtli-vue-2/commit/fcee98b16117abc9b7226e4a9e13d561d7933a08))
* introduce `File` structure and add a basic editor ([0d1bc13](https://github.com/ackzell/amoxtli-vue-2/commit/0d1bc13e4aef14a0967763c1d6671e17caa09298))
* loading template async ([1672dc1](https://github.com/ackzell/amoxtli-vue-2/commit/1672dc19f6574389be7bff5242cba618509531b1))
* match themes for monaco ([e2a7ded](https://github.com/ackzell/amoxtli-vue-2/commit/e2a7ded77f8d773dc458e586bda78139ddcf94ac))
* migrate to Content v3 ([#209](https://github.com/ackzell/amoxtli-vue-2/issues/209)) ([6ce4386](https://github.com/ackzell/amoxtli-vue-2/commit/6ce4386a25a1342cb30376662b6a9655f1462118))
* move version information on preview panel ([3b9cc11](https://github.com/ackzell/amoxtli-vue-2/commit/3b9cc11b783338a919e8d8afd09f0ebd17ca62ea))
* navigate different guides and update the playground ([be73cc4](https://github.com/ackzell/amoxtli-vue-2/commit/be73cc4dcd94ee9a23b52371545ff0ac69ed5d35))
* prev/next buttons for navigation ([1708e26](https://github.com/ackzell/amoxtli-vue-2/commit/1708e26b8c49c82b3dacf198999de5b7af0fcaec))
* preview url path navigation ([#21](https://github.com/ackzell/amoxtli-vue-2/issues/21)) ([e13e84c](https://github.com/ackzell/amoxtli-vue-2/commit/e13e84caf74cfabc7cef5f0daf301a4eeea8d492))
* read tsconfig from `.nuxt/tsconfig.json` ([a31db12](https://github.com/ackzell/amoxtli-vue-2/commit/a31db128fc0491ded7406b21ed9f974611738892))
* refactor using Pinia ([9913b51](https://github.com/ackzell/amoxtli-vue-2/commit/9913b51d47dedfe6c0681568e309aa02b24020a4))
* rename to `Nuxt Totorial` ([8c68891](https://github.com/ackzell/amoxtli-vue-2/commit/8c6889108d7e9c5d620264daa3ceb1be1d45e5c7))
* set language configurations to make brackets and quotes auto close ([#248](https://github.com/ackzell/amoxtli-vue-2/issues/248)) ([de70458](https://github.com/ackzell/amoxtli-vue-2/commit/de704589074cc08b085c89780ea9f4b6c69c393c))
* setup basic monaco editor ([c99874d](https://github.com/ackzell/amoxtli-vue-2/commit/c99874d9fac39382f13b33af218504959c89280f))
* show panel loading status ([f6d4f5a](https://github.com/ackzell/amoxtli-vue-2/commit/f6d4f5a675774083610ee5db113f7df03a02eb17))
* stable layout on SSR ([3bace58](https://github.com/ackzell/amoxtli-vue-2/commit/3bace58df27655f2ef08069e79cc618103552938))
* starting to create a vue-live component ([99fe726](https://github.com/ackzell/amoxtli-vue-2/commit/99fe726be6018068cc5683964337ce176f6fec31))
* support embedded nuxt docs ([ffbf14e](https://github.com/ackzell/amoxtli-vue-2/commit/ffbf14ec8c4a174ff5d379057a312d8fe54c9125))
* support mounted nested folder to WC ([52d8700](https://github.com/ackzell/amoxtli-vue-2/commit/52d87006c2d98d854b9a6edbec84d6e4c1dea59c))
* support resizable panels ([1e02d35](https://github.com/ackzell/amoxtli-vue-2/commit/1e02d350ed972fdcda24d436d513239fcc4ba6bf))
* sync color mode with iframe ([d89bbb6](https://github.com/ackzell/amoxtli-vue-2/commit/d89bbb66c00f05be75861fa015749f4d6559460d))
* terminal height with parent pane ([#10](https://github.com/ackzell/amoxtli-vue-2/issues/10)) ([1c205ff](https://github.com/ackzell/amoxtli-vue-2/commit/1c205ff8f493fde4ecc66f62068151691aa3878f))
* toggle terminal ([ee11cd0](https://github.com/ackzell/amoxtli-vue-2/commit/ee11cd0ed24a98e6978ef11ac5e0bbda5fec7936))
* try to speed up container start up time ([b2f2662](https://github.com/ackzell/amoxtli-vue-2/commit/b2f2662f9b993a696d6252809253979956de7c89))
* UI tweaks ([2a0591c](https://github.com/ackzell/amoxtli-vue-2/commit/2a0591c83e04593ea2c9e515fad362dedba7a5f6))
* update file tree icons ([b72082b](https://github.com/ackzell/amoxtli-vue-2/commit/b72082b7f9934035d3d79f80244136fe5d821426))
* update file-tree icons ([ab299ce](https://github.com/ackzell/amoxtli-vue-2/commit/ab299ce762dae7ab65bb61b8ce87c4be33c5c709))
* update meta tags ([e96a1a1](https://github.com/ackzell/amoxtli-vue-2/commit/e96a1a16089895ab767dfeab4b2805a6013537cb))
* update to `@volar/monaco` and `@vue/language-service` v2 ([#150](https://github.com/ackzell/amoxtli-vue-2/issues/150)) ([5b89891](https://github.com/ackzell/amoxtli-vue-2/commit/5b898916161296a6596d0ed4ae15fbbbe9a34d68))
* upgrade deps ([#182](https://github.com/ackzell/amoxtli-vue-2/issues/182)) ([93e4d6c](https://github.com/ackzell/amoxtli-vue-2/commit/93e4d6ca46047b9469c998a8f01ce2df2ae1e511))
* use `vite.define` to set the build time ([dcf126e](https://github.com/ackzell/amoxtli-vue-2/commit/dcf126e846295b3a90feca191c9ccf97ae582c85))
* use cookies for tab size ([#14](https://github.com/ackzell/amoxtli-vue-2/issues/14)) ([4f16678](https://github.com/ackzell/amoxtli-vue-2/commit/4f16678f8586aa5652002c12c6d1710897a93716))
* use custom bundler for template ([b1c7ceb](https://github.com/ackzell/amoxtli-vue-2/commit/b1c7ceb905a9147bbd542f7aaa12ea0530cee6e0))
* use local ts instead of CDN, use vue worker for ts and js ([dd23072](https://github.com/ackzell/amoxtli-vue-2/commit/dd23072e9052a48642f2ecfa70fe78318b436166))
* use runtime config for built time ([7ddd84f](https://github.com/ackzell/amoxtli-vue-2/commit/7ddd84fc28c6659df32b25589ec0fd0a4f47141d))
* use runtime constant for repository URL ([#158](https://github.com/ackzell/amoxtli-vue-2/issues/158)) ([facdc5c](https://github.com/ackzell/amoxtli-vue-2/commit/facdc5cc7fafe39e59e6048f3cf66f7ed19db639))
* use shikiji for monaco highlighting ([08da973](https://github.com/ackzell/amoxtli-vue-2/commit/08da973af5a134471420699a5d71eeb86b0d1bd7))
* use the same og image as nuxt.com ([e23c061](https://github.com/ackzell/amoxtli-vue-2/commit/e23c061f38801180eaf2af8846f105b7d87af2eb))
* working on invite flow ([5e8e012](https://github.com/ackzell/amoxtli-vue-2/commit/5e8e0128a8814355dc0bd4e1807705bd2dc6a7f8))


### Bug Fixes

* add `min-width: 0` ([df1a6d1](https://github.com/ackzell/amoxtli-vue-2/commit/df1a6d1b4ced5e5ce4de93aa96e74a24cabea4a1))
* add missing iconset, close [#219](https://github.com/ackzell/amoxtli-vue-2/issues/219) ([761fd03](https://github.com/ackzell/amoxtli-vue-2/commit/761fd03d224a6cd9886f4887a2177660c89f6c36))
* add node_modules to INGORE_FILES ([#61](https://github.com/ackzell/amoxtli-vue-2/issues/61)) ([16d4a18](https://github.com/ackzell/amoxtli-vue-2/commit/16d4a18ceef4a41a5042674ebbd108404df32a5c))
* addressing comments in feedback of the first preview launch day and adding a version number to the feedback ([233b759](https://github.com/ackzell/amoxtli-vue-2/commit/233b759e3cfb03264b8e4578d813b453c7137206))
* allow workerd builds for wrangler compatibility ([1e8ed88](https://github.com/ackzell/amoxtli-vue-2/commit/1e8ed88b31debb1ce70525c3bfcc6bbacba7d7d6))
* always trigger `features` ref update ([a9fd0b7](https://github.com/ackzell/amoxtli-vue-2/commit/a9fd0b7acf3acc18d901ab43e521ad69d350644f))
* assign default value to ui state, fix [#95](https://github.com/ackzell/amoxtli-vue-2/issues/95) ([9f0d0a2](https://github.com/ackzell/amoxtli-vue-2/commit/9f0d0a25f11a4889b26054b7ea4a1eaf60f7a857))
* attempting to trigger the thank you dialog immediately after providing the invite code ([400b9e7](https://github.com/ackzell/amoxtli-vue-2/commit/400b9e7f372e62f8fa54c6485f15bf996568916e))
* avoid rerendering on route navigation ([3db8022](https://github.com/ackzell/amoxtli-vue-2/commit/3db8022a34a2ba5f90183fd0692a0bf9dd6ed1c5))
* change url in todo-list ([#252](https://github.com/ackzell/amoxtli-vue-2/issues/252)) ([ca66819](https://github.com/ackzell/amoxtli-vue-2/commit/ca668196492055b9e121ae9bbda93ed0022b3085))
* cloudflare didn't like the encoding ([3a6dc5c](https://github.com/ackzell/amoxtli-vue-2/commit/3a6dc5c332a8e81e906cf39207aee4031d5705a8))
* **color-mode:** use color.preference & use select ([#4](https://github.com/ackzell/amoxtli-vue-2/issues/4)) ([4108e96](https://github.com/ackzell/amoxtli-vue-2/commit/4108e96de32e09d573122eac1eff1de41962bbaf))
* concurrent boot webcontainer ([#2](https://github.com/ackzell/amoxtli-vue-2/issues/2)) ([01903d2](https://github.com/ackzell/amoxtli-vue-2/commit/01903d2abf89bade80f0a0dd8e8eae5e86f37774))
* correct terminology from "概念" to "コンセプト" in Japanese content ([#221](https://github.com/ackzell/amoxtli-vue-2/issues/221)) ([bffda4b](https://github.com/ackzell/amoxtli-vue-2/commit/bffda4bd0f60d06a352b18b157ce87caae6d0600))
* **deps:** update dependency birpc to v2 ([#188](https://github.com/ackzell/amoxtli-vue-2/issues/188)) ([84b7cbc](https://github.com/ackzell/amoxtli-vue-2/commit/84b7cbc2c5555c9037c554823ac8c2af1ebb2f81))
* **deps:** update dependency monaco-editor to ^0.45.0 ([#72](https://github.com/ackzell/amoxtli-vue-2/issues/72)) ([f5b2b1a](https://github.com/ackzell/amoxtli-vue-2/commit/f5b2b1a58329d9dcc3b535a4cf65a818ad7df523))
* **deps:** update dependency monaco-editor to ^0.50.0 ([#140](https://github.com/ackzell/amoxtli-vue-2/issues/140)) ([e609603](https://github.com/ackzell/amoxtli-vue-2/commit/e609603ec76cccbddf26b8337532aae4f83fa481))
* **deps:** update shiki monorepo to v1.10.1 ([#155](https://github.com/ackzell/amoxtli-vue-2/issues/155)) ([c5b09f4](https://github.com/ackzell/amoxtli-vue-2/commit/c5b09f4b35f8bc66f82299913057cc983afc3255))
* enable command continuation post-install interruption. ([#73](https://github.com/ackzell/amoxtli-vue-2/issues/73)) ([3344fa9](https://github.com/ackzell/amoxtli-vue-2/commit/3344fa964866941e3b67cf160bc7895b11ed61e1))
* final fix for welcome dialog? ([9427a4d](https://github.com/ackzell/amoxtli-vue-2/commit/9427a4dea6fcdf8c6f6b9c5c590a6c5dc6e794b4))
* fixes for the feedback flow ([b2e0179](https://github.com/ackzell/amoxtli-vue-2/commit/b2e017929a4fbd6732a833774eebbfa132c527b7))
* Fixing the resizing of the panels when they are swapped in order. ([aea1f00](https://github.com/ackzell/amoxtli-vue-2/commit/aea1f0000906640c2804dd5da9a7ba86d952a971))
* fixing URL to be recorded when getting feedback ([eda658e](https://github.com/ackzell/amoxtli-vue-2/commit/eda658ed66e330fcb04efa79f0dffe31ca6eaa15))
* hide fileTree by default ([39d33c0](https://github.com/ackzell/amoxtli-vue-2/commit/39d33c006aeca852b9740eb94d66ecf5a685b8e3))
* improve navigation ([21b5157](https://github.com/ackzell/amoxtli-vue-2/commit/21b5157328dff8bea8da90489afe41c9abd23d83))
* include `.layer-playground` in template correctly ([#79](https://github.com/ackzell/amoxtli-vue-2/issues/79)) ([9e461b7](https://github.com/ackzell/amoxtli-vue-2/commit/9e461b7f15d88a02d1a0459e5318f3f03487edff))
* including `.npmrc` for the basic template ([#11](https://github.com/ackzell/amoxtli-vue-2/issues/11)) ([0fc3f30](https://github.com/ackzell/amoxtli-vue-2/commit/0fc3f30d8d69533af3c58037adb5b6e9b0b21d5b))
* init pane size mistake when left pane size 100 ([#18](https://github.com/ackzell/amoxtli-vue-2/issues/18)) ([151a627](https://github.com/ackzell/amoxtli-vue-2/commit/151a627bb8d1dce484fba413f0f244bf3b9672e1))
* inline monaco-editor packages for cloudflare-pages build ([bfd3a0f](https://github.com/ackzell/amoxtli-vue-2/commit/bfd3a0f921547e78191e01cb2a2db43a2969211f))
* layout menu wasn't changing the layout. ([259c74d](https://github.com/ackzell/amoxtli-vue-2/commit/259c74dd6a10ecac7f6ce4acb28901a723be1306))
* misc fixes ([89c5405](https://github.com/ackzell/amoxtli-vue-2/commit/89c54050f44d9365a11d8a753d6e7ade4ff148fd))
* Monaco Editor tooltip obscuring API descriptions. ([#82](https://github.com/ackzell/amoxtli-vue-2/issues/82)) ([830aaff](https://github.com/ackzell/amoxtli-vue-2/commit/830aaff80d855126b7ccee7db5219cecccf71774))
* monaco editor write back ([379a371](https://github.com/ackzell/amoxtli-vue-2/commit/379a3717541b7e68b102eb1e1730b35841409727))
* monaco thorwing unexpected error ([#58](https://github.com/ackzell/amoxtli-vue-2/issues/58)) ([5e94204](https://github.com/ackzell/amoxtli-vue-2/commit/5e94204c39741f3f9cd725e838e2149d340d8b83))
* monaco update event ([c1adc41](https://github.com/ackzell/amoxtli-vue-2/commit/c1adc41aa57999fff97631b220397abdb4ffbcbf))
* **monaco:** clean up side-effects properly ([255ef18](https://github.com/ackzell/amoxtli-vue-2/commit/255ef18b7601c775ec14a3bed704b0c72102fcca))
* move "show solutions" to editor panel ([58fd454](https://github.com/ackzell/amoxtli-vue-2/commit/58fd454c0d0c979d74d5be61e47aac5346b29e6e))
* move onlyBuiltDependencies to package.json for pnpm v11 ([399deaf](https://github.com/ackzell/amoxtli-vue-2/commit/399deaf4910d14e867b497ed8c024164548d835e))
* move the version to the bottom line ([7674af0](https://github.com/ackzell/amoxtli-vue-2/commit/7674af06d6887a9fe1894e83f37a41ab69b01d28))
* ordering files ([#271](https://github.com/ackzell/amoxtli-vue-2/issues/271)) ([b0bd7c9](https://github.com/ackzell/amoxtli-vue-2/commit/b0bd7c935818a71112a02abe59713d7ac3f7b960))
* PanelDocs overflows container ([#215](https://github.com/ackzell/amoxtli-vue-2/issues/215)) ([82f13de](https://github.com/ackzell/amoxtli-vue-2/commit/82f13deafe19d29610e15fbf13987a513bffba43))
* persist scroll position of terminal ([#87](https://github.com/ackzell/amoxtli-vue-2/issues/87)) ([f438345](https://github.com/ackzell/amoxtli-vue-2/commit/f438345916a7a8dceabd6706e97818afe3b54c6a))
* prevent unexpected reloading to fix `entry.js` response html ([#13](https://github.com/ackzell/amoxtli-vue-2/issues/13)) ([2712c33](https://github.com/ackzell/amoxtli-vue-2/commit/2712c33c60e03857987017b7cea69256f00ece58))
* preview pane size ([#31](https://github.com/ackzell/amoxtli-vue-2/issues/31)) ([944840a](https://github.com/ackzell/amoxtli-vue-2/commit/944840ae9b9db0248146fd266b8fc80227f62721))
* preview refresh button is now shown ([#179](https://github.com/ackzell/amoxtli-vue-2/issues/179)) ([0ee1df6](https://github.com/ackzell/amoxtli-vue-2/commit/0ee1df654ccfefdd5df592aec3b4c8847521b6f9))
* put onlyBuiltDependencies back in pnpm-workspace.yaml with vue-demi ([dc17c15](https://github.com/ackzell/amoxtli-vue-2/commit/dc17c15c4531a8d8105e099be80738c99d62973b))
* remove content doc max width ([#49](https://github.com/ackzell/amoxtli-vue-2/issues/49)) ([eee3a82](https://github.com/ackzell/amoxtli-vue-2/commit/eee3a820fbb3439340b90a98cb565ff59f1e3025))
* remove duplicated locale segment in source URL ([#227](https://github.com/ackzell/amoxtli-vue-2/issues/227)) ([0201de3](https://github.com/ackzell/amoxtli-vue-2/commit/0201de3165fd2273af826dfb5e2bd8262fa206ce))
* remove textarea resize button ([#47](https://github.com/ackzell/amoxtli-vue-2/issues/47)) ([e4456b8](https://github.com/ackzell/amoxtli-vue-2/commit/e4456b8a7399eb33c678d9dc107977a7f0007801))
* remove unused prop 'message' from Child component ([#250](https://github.com/ackzell/amoxtli-vue-2/issues/250)) ([e7f46b4](https://github.com/ackzell/amoxtli-vue-2/commit/e7f46b4c6f4a2abe07646dd2f5b4751475326d4b))
* removing auto uppercase change for the invite codes. ([7062570](https://github.com/ackzell/amoxtli-vue-2/commit/70625709eb4eb144cb9058becba556a71aab8c0c))
* replace createHighlighter from shiki with createHighlighterCore from @shikijs/core to avoid bundling all 300+ grammars ([0bcb3da](https://github.com/ackzell/amoxtli-vue-2/commit/0bcb3da41ca061a0a6039820c821a54b4e61baa1))
* replace Shiki WASM engine with JS engine and prune Worker bundle ([5b6aec3](https://github.com/ackzell/amoxtli-vue-2/commit/5b6aec383224c55a1b58e85da7ea1d2fcd3ff6ba))
* revert `previewLocation` to `ref` type ([#28](https://github.com/ackzell/amoxtli-vue-2/issues/28)) ([1289604](https://github.com/ackzell/amoxtli-vue-2/commit/1289604c41d255413211d9d4e4605e359771332b))
* save color mode after toggle ([#37](https://github.com/ackzell/amoxtli-vue-2/issues/37)) ([d1aec8c](https://github.com/ackzell/amoxtli-vue-2/commit/d1aec8c1abaf971d4ac11074df61c86d309bc333))
* screen flashing during iframe navigation ([#55](https://github.com/ackzell/amoxtli-vue-2/issues/55)) ([de6f2ba](https://github.com/ackzell/amoxtli-vue-2/commit/de6f2ba5caeae81069db7a9107e2f91563a58c6f))
* show solution button layouting ([818b8c0](https://github.com/ackzell/amoxtli-vue-2/commit/818b8c059afda633cecd25a40aad5439363b6e71))
* show terminal by default ([b22bd36](https://github.com/ackzell/amoxtli-vue-2/commit/b22bd36dc079a105bc5c10cd416894ffd1368680))
* show welcome dialog immediately after invite is validated successfully ([6911de5](https://github.com/ackzell/amoxtli-vue-2/commit/6911de5bb85242c2d3db732a8a4656ea194017f9))
* splitpane error ([7c7a68f](https://github.com/ackzell/amoxtli-vue-2/commit/7c7a68f5dadcb16493f8a6907f7b3278de104f32))
* start volar when wc is ready ([350358b](https://github.com/ackzell/amoxtli-vue-2/commit/350358ba46f7b7b3b71446c4f70271e8c49cea3d))
* stub monaco-editor-core for cloudflare server build, increase heap to 6GB, fix deploy path ([438e010](https://github.com/ackzell/amoxtli-vue-2/commit/438e010d4cc2a784c493245477f27ab51cf728f6))
* **style:** remove duplicate borders ([#8](https://github.com/ackzell/amoxtli-vue-2/issues/8)) ([f2d4d8d](https://github.com/ackzell/amoxtli-vue-2/commit/f2d4d8d28c6749bcff2c702475140cfb6e178920))
* styling ([5c43abe](https://github.com/ackzell/amoxtli-vue-2/commit/5c43abe763acdfb6e62f003edb7d137210dcde66))
* **template:** move communication logic to plugin ([b0d4ba8](https://github.com/ackzell/amoxtli-vue-2/commit/b0d4ba82bc12f71e1e9091ff1084750581442d06))
* **template:** use semver version of `packageManager` ([#78](https://github.com/ackzell/amoxtli-vue-2/issues/78)) ([d930264](https://github.com/ackzell/amoxtli-vue-2/commit/d930264222ed43e635bab6cda53622cdc1e3a178))
* terminal height ([#5](https://github.com/ackzell/amoxtli-vue-2/issues/5)) ([7358c05](https://github.com/ackzell/amoxtli-vue-2/commit/7358c05aeff6909daf6259de5f8b68fc9654fb33))
* the guide should properly render a split defined template instead of getting stuck to "docs only" ([c808fea](https://github.com/ackzell/amoxtli-vue-2/commit/c808feab7de75899b0e9a3834465c8a438a23481))
* the transition should only run when docs / code and not between lessons (for now) ([b2e68b5](https://github.com/ackzell/amoxtli-vue-2/commit/b2e68b544f77b22a2dc361567360b84db1f3b4cf))
* title from content ([7bf3d56](https://github.com/ackzell/amoxtli-vue-2/commit/7bf3d56a499c4479da37a0522c59914f761dd2ae))
* TODO list ([#279](https://github.com/ackzell/amoxtli-vue-2/issues/279)) ([a8d3649](https://github.com/ackzell/amoxtli-vue-2/commit/a8d36497462bf5b058132d21fcc27a07d9161a61))
* TODO list CreateModal => AppModal ([#262](https://github.com/ackzell/amoxtli-vue-2/issues/262)) ([fe73755](https://github.com/ackzell/amoxtli-vue-2/commit/fe7375589826cf97e53c72417c49d533f367a473))
* TODO list index, others ([#263](https://github.com/ackzell/amoxtli-vue-2/issues/263)) ([a82def5](https://github.com/ackzell/amoxtli-vue-2/commit/a82def5d7aedbc6e2ba71985aa20caa9fbeb4055))
* TODO list slot, others ([#264](https://github.com/ackzell/amoxtli-vue-2/issues/264)) ([23aa4c3](https://github.com/ackzell/amoxtli-vue-2/commit/23aa4c3afdaef8f9c88741108f9e2d6cdfd0f42d))
* tooltips behavior wasn't correct for mobile. ([3ad70a9](https://github.com/ackzell/amoxtli-vue-2/commit/3ad70a930b21dae326d34b4d597099765e15f91d))
* type error ([f5402a3](https://github.com/ackzell/amoxtli-vue-2/commit/f5402a38634ce203b638204e3dd2ebf40cfcbaf7))
* update cookie default value ([0282674](https://github.com/ackzell/amoxtli-vue-2/commit/0282674ff35a943183275798703972dc1c5892bf))
* use allowBuilds in pnpm-workspace.yaml for pnpm v11 compatibility ([e1fc803](https://github.com/ackzell/amoxtli-vue-2/commit/e1fc80306826de19f4acd622c94bf12fbd7d1224))
* web containers deps install ([98f4331](https://github.com/ackzell/amoxtli-vue-2/commit/98f4331a75ac6a52fceed224e7cd6b7490f04f6e))
* working on the styles for the docs navigation. the container shouldn't grow tall when not enough space is available in the nav. Rather the contents should present ellipsis ([49fed44](https://github.com/ackzell/amoxtli-vue-2/commit/49fed440fd0f55c640df6bd1716447885adac9f1))
* workspace packages path typo ([#67](https://github.com/ackzell/amoxtli-vue-2/issues/67)) ([2a7e013](https://github.com/ackzell/amoxtli-vue-2/commit/2a7e0131a88dbc05e7b08d4e62936c3e19b2bb40))
* 独自コンポーネント全体修正 ([#260](https://github.com/ackzell/amoxtli-vue-2/issues/260)) ([fd43cd6](https://github.com/ackzell/amoxtli-vue-2/commit/fd43cd6cb48cd609a92888022c740438f00f8e8b))
