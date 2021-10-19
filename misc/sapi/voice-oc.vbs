Set cat = CreateObject("SAPI.SpObjectTokenCategory")
cat.SetID "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices", False
For Each token In cat.EnumerateTokens
    WScript.Echo token.GetDescription
Next
