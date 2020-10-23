plugins {
	kotlin("jvm") version "1.4.10"
	id("nebula.release") version "15.2.0"
	id("ru.capjack.bintray") version "1.0.0"
}

group = "ru.capjack.tool"

repositories {
	jcenter()
}

kotlin {
	target.compilations.all { kotlinOptions.jvmTarget = "1.8" }
}

dependencies {
	implementation("commons-codec:commons-codec:1.15")
}