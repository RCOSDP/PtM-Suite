Set sapi = CreateObject("SAPI.SpVoice")
For Each voice In sapi.GetVoices
    WScript.Echo voice.GetDescription
Next
