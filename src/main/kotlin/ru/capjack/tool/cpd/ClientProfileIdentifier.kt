package ru.capjack.tool.cpd

interface ClientProfileIdentifier {
	fun identify(query: String): String
}