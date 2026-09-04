---
description: English entry point for the Zongsoft framework, hosts, and developer toolchain documentation.
icon: book-open
---

# Zongsoft Framework

[English](README.md) | [简体中文](README.zh-Hans.md)

![Zongsoft documentation cover](.gitbook/assets/zongsoft-docs-cover.svg)

Zongsoft is a family of open-source .NET frameworks, application hosts, and development tools for building pluggable, deployable, and maintainable business applications.

It has three closely related areas:

{% columns %}
{% column %}
### Framework

Core abstractions, the plugin framework, data engine, Web foundation, security, diagnostics, messaging, application upgrading, and adapters for common third-party services.
{% endcolumn %}

{% column %}
### Hosts and tools

Hosts load and run pluggable applications. The toolchain deploys plugins, creates installation packages, publishes upgrade packages, and supports development and diagnostics.
{% endcolumn %}
{% endcolumns %}

## Quick Navigation

<table data-card-size="large" data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">Page</th>
			<th data-hidden data-card-cover data-type="image">Cover</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Understand the design</strong></td>
			<td>Start with the boundaries between the framework, hosts, and tools.</td>
			<td><a href="overview/what-is-zongsoft.md">what-is-zongsoft.md</a></td>
			<td><a href=".gitbook/assets/zongsoft-docs-cover.svg">zongsoft-docs-cover.svg</a></td>
		</tr>
		<tr>
			<td><strong>Prepare a local environment</strong></td>
			<td>Install the SDK, obtain the source, and prepare optional container services.</td>
			<td><a href="get-started/prerequisites.md">prerequisites.md</a></td>
			<td><a href=".gitbook/assets/zongsoft-start-cover.svg">zongsoft-start-cover.svg</a></td>
		</tr>
		<tr>
			<td><strong>Learn pluggable applications</strong></td>
			<td>Understand the plugin tree, built-ins, service registration, and host integration.</td>
			<td><a href="framework/plugins/README.md">plugins</a></td>
			<td><a href=".gitbook/assets/zongsoft-plugins-cover.svg">zongsoft-plugins-cover.svg</a></td>
		</tr>
		<tr>
			<td><strong>Learn data access</strong></td>
			<td>Read and write object graphs with data schemas, mappings, and database drivers.</td>
			<td><a href="framework/data/README.md">data</a></td>
			<td><a href=".gitbook/assets/zongsoft-data-cover.svg">zongsoft-data-cover.svg</a></td>
		</tr>
	</tbody>
</table>

## Suggested Reading Path

1. Read [What is Zongsoft](overview/what-is-zongsoft.md) to understand the overall boundaries.
2. Read [Pluginization](overview/pluginization.md) to learn why business capabilities are organized as plugins.
3. Follow [Prerequisites](get-started/prerequisites.md) and [Install Packages](get-started/install.md) to prepare the local environment.
4. Choose an [application host](get-started/hosting.md) and deploy the first plugin.
5. Continue with the framework guides for Core, Plugins, Data, Web, and other relevant areas.

{% hint style="info" %}
The documentation is organized around the workflow for building a pluggable application rather than as a package-by-package catalog. See the [package and module index](references/packages.md) for package names, source locations, and module relationships.
{% endhint %}
