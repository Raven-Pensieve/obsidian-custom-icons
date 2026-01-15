/**
 * 从 SVG 字符串中移除 width 和 height 属性
 * @param svgContent 原始 SVG 字符串
 * @returns 清理后的 SVG 字符串
 */
export function cleanSvg(svgContent: string): string {
	if (!svgContent) return "";

	return svgContent
		.replace(/\s*width=["'][^"']*["']/gi, "")
		.replace(/\s*height=["'][^"']*["']/gi, "");
}
