package ru.capjack.tool.cpd

fun interface ClientProfileIdentifier {
	fun identify(query: String): String
}

