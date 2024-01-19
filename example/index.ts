import { HLSPonyfillVideoElement } from '../src';
import Hls from 'hls.js';

HLSPonyfillVideoElement.Hls = Hls;
HLSPonyfillVideoElement.install();
