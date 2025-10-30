import React from 'react';
import { hubspot } from '@hubspot/ui-extensions';
import { uiExtensionsReactRenderer } from '@hubspot/ui-extensions-react';
import BreezeCrmCardApp from './BreezeCrmCardApp';

hubspot.extend(({ context, actions }) =>
  uiExtensionsReactRenderer(<BreezeCrmCardApp context={context} actions={actions} />),
);
