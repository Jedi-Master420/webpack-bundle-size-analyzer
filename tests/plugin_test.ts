import fs = require('fs');
import path = require('path');
import webpack_stats = require('../src/webpack_stats');
import lib = require('../src/plugin');
const statsJson = fs.readFileSync(path.join('tests', 'fixtures/stats.json')).toString();
const stats = <webpack_stats.WebpackCompilation>JSON.parse(statsJson);

let compilerMock: any;
let fsMock: jest.Mock<any>;
let statsMock: any;
let originalWriteFile: any;

describe('WebpackBundleSizeAnalyzerPlugin', () => {
	beforeEach(() => {
		originalWriteFile = fs.writeFile;
		fsMock = jest.fn();
		fs.writeFile = fsMock as any;
		compilerMock = {
			outputPath: './mock-path',
			hooks: {
				done: {
					tap: (pluginTitle: any, callback: any) => {
						expect(pluginTitle).toEqual('WebpackBundleSizeAnalyzerPlugin');
						callback(statsMock);
					}
				}
			}
		};
		statsMock = {
			toJson: () => stats
		};
	});
	afterEach(() => {
		fs.writeFile = originalWriteFile;
	});
	it('should not generate a report when no file path is provided', () => {
		const plugin = new lib.WebpackBundleSizeAnalyzerPlugin();
		expect(plugin).toMatchSnapshot();
		plugin.apply(compilerMock);
		expect(fsMock.mock.calls).toHaveLength(0);
	});
	it('should generate a report when a relative file path is provided', () => {
		const plugin = new lib.WebpackBundleSizeAnalyzerPlugin('./report.txt');
		expect(plugin).toMatchSnapshot();
		plugin.apply(compilerMock);
		expect(fsMock.mock.calls).toHaveLength(1);
		expect(fsMock.mock.calls[0][0]).toContain('/mock-path/report.txt');
		expect(fsMock.mock.calls[0][1]).toContain('style-loader: 717 B');
		expect(fsMock.mock.calls[0][2]).toEqual('utf8');
		expect(fsMock.mock.calls[0][3]).toBeInstanceOf(Function);
	});
	it('should generate a report when an absolute file path is provided', () => {
		const plugin = new lib.WebpackBundleSizeAnalyzerPlugin('/absolute/report.txt');
		expect(plugin).toMatchSnapshot();
		plugin.apply(compilerMock);
		expect(fsMock.mock.calls).toHaveLength(1);
		expect(fsMock.mock.calls[0][0]).toContain('/absolute/report.txt');
		expect(fsMock.mock.calls[0][0]).not.toContain('mock-path');
		expect(fsMock.mock.calls[0][1]).toContain('style-loader: 717 B');
		expect(fsMock.mock.calls[0][2]).toEqual('utf8');
		expect(fsMock.mock.calls[0][3]).toBeInstanceOf(Function);
	});
	it('supports providing options for `Stats.toJson`', () => {
		const plugin = new lib.WebpackBundleSizeAnalyzerPlugin('./report.txt', {
			warnings: false
		});
		expect(plugin).toMatchSnapshot();
		plugin.apply(compilerMock);
		expect(fsMock.mock.calls).toHaveLength(1);
		expect(fsMock.mock.calls[0][0]).toContain('/mock-path/report.txt');
		expect(fsMock.mock.calls[0][1]).toContain('style-loader: 717 B');
		expect(fsMock.mock.calls[0][2]).toEqual('utf8');
		expect(fsMock.mock.calls[0][3]).toBeInstanceOf(Function);
	});
});
