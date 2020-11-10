package ru.capjack.tool.cpd

fun interface AccountIdentifier {
	fun identify(query: String): String
}

