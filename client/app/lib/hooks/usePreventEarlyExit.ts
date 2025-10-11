import { useCallback, useEffect, useRef } from "react"
import { Alert, BackHandler } from "react-native"
import type { Socket } from "socket.io-client"
import { useFocusEffect, useNavigation } from "expo-router"

type Options = {
  socket: Socket | null
  isGameActive: boolean
}

export function usePreventEarlyExit({ socket, isGameActive }: Options) {
  const navigation = useNavigation()
  const alertVisibleRef = useRef(false)

  const showResignPrompt = useCallback(() => {
    if (!isGameActive || alertVisibleRef.current) {
      return
    }

    alertVisibleRef.current = true
    Alert.alert(
      "Leave Game?",
      "You must resign to leave an active game.",
      [
        {
          text: "Stay",
          style: "cancel",
          onPress: () => {
            alertVisibleRef.current = false
          },
        },
        {
          text: "Resign",
          style: "destructive",
          onPress: () => {
            alertVisibleRef.current = false

            if (socket) {
              socket.emit("game:resign")
            } else {
              Alert.alert("Connection Issue", "Unable to resign while offline. Attempting to reconnect.")
            }
          },
        },
      ],
      { cancelable: false },
    )
  }, [isGameActive, socket])

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!isGameActive) {
          return false
        }

        showResignPrompt()
        return true
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)
      return () => subscription.remove()
    }, [isGameActive, showResignPrompt]),
  )

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (!isGameActive) {
        return
      }

      event.preventDefault()
      showResignPrompt()
    })

    return unsubscribe
  }, [navigation, isGameActive, showResignPrompt])
}

