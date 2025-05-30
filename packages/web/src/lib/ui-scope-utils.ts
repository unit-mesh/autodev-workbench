import { uiScope, componentCategories, createCustomScope } from "./ui-scope"

/**
 * Utility functions for managing UI scope in React Live
 */

/**
 * Get scope for specific component categories
 */
export function getScopeByCategory(categories: (keyof typeof componentCategories)[]): Record<string, any> {
	const componentNames: string[] = []
	
	categories.forEach(category => {
		componentNames.push(...componentCategories[category])
	})
	
	return createCustomScope(componentNames as (keyof typeof uiScope)[])
}

/**
 * Common scope presets for different use cases
 */
export const scopePresets = {
	/**
	 * Basic scope with essential components
	 */
	basic: createCustomScope([
		'Button', 'Input', 'Label', 'Card', 'CardHeader', 'CardContent', 'CardTitle', 'CardDescription'
	]),
	
	/**
	 * Form-focused scope
	 */
	forms: getScopeByCategory(['forms']),
	
	/**
	 * Layout-focused scope
	 */
	layout: getScopeByCategory(['layout']),
	
	/**
	 * Data display scope
	 */
	display: getScopeByCategory(['display']),
	
	/**
	 * Interactive elements scope
	 */
	interactive: createCustomScope([
		'Button', 'Dialog', 'DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription',
		'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem',
		'Popover', 'PopoverTrigger', 'PopoverContent',
		'Tooltip', 'TooltipTrigger', 'TooltipContent', 'TooltipProvider'
	]),
	
	/**
	 * Complete scope with all components
	 */
	complete: uiScope
} as const

/**
 * Get scope with React hooks and utilities added
 */
export function getScopeWithReactUtils(baseScope: Record<string, any> = uiScope): Record<string, any> {
	return {
		...baseScope,
		React: {
			useState: React.useState,
			useEffect: React.useEffect,
			useCallback: React.useCallback,
			useMemo: React.useMemo,
			useRef: React.useRef,
		}
	}
}

/**
 * Validate if a component exists in scope
 */
export function isComponentAvailable(componentName: string, scope: Record<string, any> = uiScope): boolean {
	return componentName in scope
}

/**
 * Get list of available component names from scope
 */
export function getAvailableComponents(scope: Record<string, any> = uiScope): string[] {
	return Object.keys(scope).sort()
}

/**
 * Search for components by name pattern
 */
export function searchComponents(pattern: string, scope: Record<string, any> = uiScope): string[] {
	const regex = new RegExp(pattern, 'i')
	return Object.keys(scope).filter(name => regex.test(name)).sort()
}

/**
 * Get components by prefix (e.g., "Dialog" returns all Dialog-related components)
 */
export function getComponentsByPrefix(prefix: string, scope: Record<string, any> = uiScope): Record<string, any> {
	const filteredScope: Record<string, any> = {}
	
	Object.keys(scope).forEach(name => {
		if (name.startsWith(prefix)) {
			filteredScope[name] = scope[name]
		}
	})
	
	return filteredScope
}

export default {
	scopePresets,
	getScopeByCategory,
	getScopeWithReactUtils,
	isComponentAvailable,
	getAvailableComponents,
	searchComponents,
	getComponentsByPrefix
}