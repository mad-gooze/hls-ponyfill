import { HLSPonyfillVideoElement } from '../src';
import Hls from 'hls.js';

HLSPonyfillVideoElement.setHlsConstructor(Hls);
HLSPonyfillVideoElement.install();
