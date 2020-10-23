plugins {
	base
	id("com.moowork.node") version "1.3.1"
}

val distributionDir = buildDir.resolve("distribution")

task<com.moowork.gradle.node.npm.NpmTask>("compile") {
	setArgs(listOf("run", "compile"))
}

task("generatePackageJson") {
	val inputFile = file("package.json")
	val outputFile = distributionDir.resolve("package.json")
	
	inputs.file(inputFile)
	outputs.file(outputFile)
	
	doLast {
		val p = loadPackageJson()
		
		p.remove("scripts")
		p.remove("devDependencies")
		
		p["version"] = version.toString()
		p["main"] = "index.js"
		
		outputFile.writeText(
			groovy.json.JsonBuilder(p).toPrettyString()
		)
	}
}

tasks.getByName("assemble") {
	dependsOn("generatePackageJson", "compile")
}

task<com.moowork.gradle.node.npm.NpmTask>("publish") {
	dependsOn("build")
	setArgs(listOf("publish"))
	setWorkingDir(distributionDir)
}

parent!!.tasks.getByName("release").dependsOn("publish")


task<com.moowork.gradle.node.npm.NpmTask>("unpublish") {
	doFirst {
		val n = loadPackageJson().getValue("name") as String
		val v = ext.get("unpublish.version") as String
		if (v == "all") {
			setArgs(listOf("unpublish", n, "-f"))
		}
		else {
			setArgs(listOf("unpublish", "$n@$v"))
		}
	}
}

fun Project.loadPackageJson(): MutableMap<String, Any> {
	@Suppress("UNCHECKED_CAST")
	return groovy.json.JsonSlurper().parse(file("package.json")) as MutableMap<String, Any>
}